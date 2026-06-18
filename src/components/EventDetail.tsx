/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Eye, Upload, Trash2, 
  Settings, Award, RefreshCw, BarChart2, Layers, Users, 
  QrCode, Clipboard, Copy, Download, Sparkles, FolderUp, Archive, Shield, X, Clock 
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Event, Photo, Guest, AuditLog } from '../types';
import EventQRCode, { PrintablePoster } from './EventQRCode';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface EventDetailProps {
  event: Event;
  currentUser: any;
  onBack: () => void;
  onEventUpdated: (e: Event) => void;
}

export default function EventDetail({ event, currentUser, onBack, onEventUpdated }: EventDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'guests' | 'analytics' | 'settings'>('overview');
  
  const [photosList, setPhotosList] = useState<Photo[]>([]);
  const [guestsList, setGuestsList] = useState<Guest[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotoIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const downloadSelectedAsZip = async () => {
    if (selectedPhotoIds.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);
    try {
      const zip = new JSZip();
      const folderName = `PhotoSeek_Admin_${event.name.replace(/\s+/g, '_')}`;
      const folder = zip.folder(folderName);
      
      for (let i = 0; i < selectedPhotoIds.length; i++) {
        const pId = selectedPhotoIds[i];
        const photo = photosList.find(p => p.id === pId);
        if (!photo) continue;

        try {
          const resp = await fetch(photo.url);
          const blob = await resp.blob();
          const cleanExt = photo.url.split('.').pop()?.split('?')[0] || 'jpg';
          folder?.file(`Photo_${i + 1}_${photo.id}.${cleanExt}`, blob);
        } catch (err) {
          console.error('Error fetching source image blob:', photo.url, err);
        }
        
        setZipProgress(Math.round(((i + 1) / selectedPhotoIds.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}_Selection.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP packaging exception:', err);
      alert('Error during ZIP folder composition.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };
  
  // Settings form states
  const [name, setName] = useState(event.name);
  const [location, setLocation] = useState(event.location);
  const [description, setDescription] = useState(event.description);
  const [downloadsLimit, setDownloadsLimit] = useState(event.downloadsLimit || 500);
  const [expiryDate, setExpiryDate] = useState(event.expiryDate || '');
  const [retentionPeriodDays, setRetentionPeriodDays] = useState<number>(event.retentionPeriodDays || 30);
  const [watermarkText, setWatermarkText] = useState(event.customBranding?.watermarkText || '');
  const [enableWatermark, setEnableWatermark] = useState(event.customBranding?.enableWatermark || false);
  const [watermarkLogo, setWatermarkLogo] = useState(event.customBranding?.logo || '');

  // Search Trends Analytics states
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Poster customization states
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [posterTitle, setPosterTitle] = useState(event.name);
  const [posterSubtitle, setPosterSubtitle] = useState('Scan to find and download your matching event photos instantly!');
  const [posterTheme, setPosterTheme] = useState<'slate' | 'rose' | 'emerald' | 'amber'>('rose');
  const [includeSelfieSearch, setIncludeSelfieSearch] = useState(true);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const fullUrl = `${window.location.origin}?event=${event.id}`;
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 512,
          margin: 1,
          color: {
            dark: '#0f172a', // Deep slate primary color
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    };
    generateQR();
  }, [event.id]);

  useEffect(() => {
    setPosterTitle(event.name);
  }, [event.name]);

  useEffect(() => {
    setName(event.name);
    setLocation(event.location);
    setDescription(event.description);
    setDownloadsLimit(event.downloadsLimit || 500);
    setWatermarkText(event.customBranding?.watermarkText || '');
    setEnableWatermark(event.customBranding?.enableWatermark || false);
    setWatermarkLogo(event.customBranding?.logo || '');
    setExpiryDate(event.expiryDate || '');
    setRetentionPeriodDays(event.retentionPeriodDays || 30);
  }, [event]);

  const downloadPosterAsImage = async () => {
    if (!qrCodeDataUrl) return;
    setIsGeneratingPoster(true);

    try {
      // Create a canvas for high-quality printing (1200 x 1600 px)
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const themeColors = {
        rose: { primary: '#e11d48', bgLight: '#f8fafc', accent: '#fda4af' },
        slate: { primary: '#1e293b', bgLight: '#f1f5f9', accent: '#cbd5e1' },
        emerald: { primary: '#059669', bgLight: '#f0fdf4', accent: '#6ee7b7' },
        amber: { primary: '#d97706', bgLight: '#fffbeb', accent: '#fde047' }
      };

      const selectedTheme = themeColors[posterTheme] || themeColors.rose;

      // 1. Draw background
      const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, selectedTheme.bgLight);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 1600);

      // 2. Draw modern solid border frame
      ctx.strokeStyle = '#e2e8f0'; // slate-200
      ctx.lineWidth = 16;
      ctx.strokeRect(32, 32, 1200 - 64, 1600 - 64);

      // Decorative accent corners
      ctx.strokeStyle = selectedTheme.primary;
      ctx.lineWidth = 24;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(80, 48); ctx.lineTo(48, 48); ctx.lineTo(48, 80);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(1200 - 80, 48); ctx.lineTo(1200 - 48, 48); ctx.lineTo(1200 - 48, 80);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(80, 1600 - 48); ctx.lineTo(48, 1600 - 48); ctx.lineTo(48, 1600 - 80);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(1200 - 80, 1600 - 48); ctx.lineTo(1200 - 48, 1600 - 48); ctx.lineTo(1200 - 48, 1600 - 80);
      ctx.stroke();

      // 3. Draw Branding Header "PhotoSeek AI"
      ctx.shadowColor = 'rgba(0, 0, 0, 0.03)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      ctx.fillStyle = selectedTheme.primary;
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PHOTOSEEK AI', 600, 140);

      // Sub-header
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '600 20px monospace';
      ctx.fillText('• SECURE EVENT GALLERY GATEWAY •', 600, 185);

      // 4. Poster Main Banner Title
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = 'bold 60px sans-serif';
      
      const titleStr = posterTitle || event.name;
      const maxLength = 30;
      if (titleStr.length > maxLength) {
        const words = titleStr.split(' ');
        let currentLine = '';
        let lines = [];
        for (const w of words) {
          if ((currentLine + w).length > maxLength) {
            lines.push(currentLine.trim());
            currentLine = w + ' ';
          } else {
            currentLine += w + ' ';
          }
        }
        lines.push(currentLine.trim());
        
        ctx.fillText(lines[0], 600, 300);
        if (lines[1]) ctx.fillText(lines[1], 600, 370);
      } else {
        ctx.fillText(titleStr, 600, 320);
      }

      // 5. Draw Venue & Date Details
      ctx.fillStyle = '#475569'; // slate-600
      ctx.font = '500 26px sans-serif';
      const locationText = event.location ? `📍 ${event.location}` : '';
      const dateText = event.date ? `📅 ${new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}` : '';
      ctx.fillText(`${locationText}   ${dateText}`.trim(), 600, 440);

      // Divider line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(300, 490);
      ctx.lineTo(900, 490);
      ctx.stroke();

      // 6. Draw QR Code Instruction
      ctx.fillStyle = '#1e293b'; // slate-800
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('SCAN TO RETRIEVE PHOTOS', 600, 580);

      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '400 24px sans-serif';
      
      const subText = posterSubtitle;
      const subWords = subText.split(' ');
      let subLine = '';
      let subLines = [];
      for (const sw of subWords) {
        if ((subLine + sw).length > 60) {
          subLines.push(subLine.trim());
          subLine = sw + ' ';
        } else {
          subLine += sw + ' ';
        }
      }
      subLines.push(subLine.trim());

      ctx.fillText(subLines[0], 600, 630);
      if (subLines[1]) ctx.fillText(subLines[1], 600, 670);

      // 7. Render QR Code image
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      qrImage.src = qrCodeDataUrl;

      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetY = 12;
          ctx.fillStyle = '#ffffff';
          
          const rx = 350;
          const ry = 720;
          const rw = 500;
          const rh = 500;
          const radius = 24;
          
          ctx.beginPath();
          ctx.moveTo(rx + radius, ry);
          ctx.lineTo(rx + rw - radius, ry);
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
          ctx.lineTo(rx + rw, ry + rh - radius);
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
          ctx.lineTo(rx + radius, ry + rh);
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
          ctx.lineTo(rx, ry + radius);
          ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
          ctx.closePath();
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.drawImage(qrImage, 385, 755, 430, 430);
          resolve();
        };
        qrImage.onerror = (e) => reject(e);
      });

      // 8. Selfie filter instructions
      if (includeSelfieSearch) {
        ctx.fillStyle = selectedTheme.primary;
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('✨ INTEGRATED PHOTOSEEK SELFIE SEARCH ✨', 600, 1300);

        ctx.fillStyle = '#475569';
        ctx.font = '500 22px sans-serif';
        ctx.fillText('Take or upload a quick selfie to immediately filter photos featuring you!', 600, 1345);
      }

      // Link footer
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`Direct Link: ${window.location.origin}?event=${event.id}`, 600, 1430);

      // Metadata terms
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px monospace';
      ctx.fillText('SECURE WATERMARKED PREVIEWS • POWERED BY CLOUDFLARE R2', 600, 1510);

      // 9. Download trigger
      const posterDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = posterDataUrl;
      link.download = `Poster_${event.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error rendering poster canvas.');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Event Photos
      const photoRes = await fetch(`/api/photos?eventId=${event.id}`);
      const photosData = await photoRes.json();
      setPhotosList(photosData);

      // 2. Fetch Guests and downloads (from comprehensive DB lists matching eventId)
      // Since our main db is server-side and lists are simple, we simulate fetching matching guests
      const dbRes = await fetch('/api/audit-logs');
      const debugLogs = await dbRes.json();
      
      // Filter logs or guests relating to this event
      setGuestsList([
        { id: 'gst_101', name: 'Tiffany Alvarez', email: 'tiffany@alvarez.com', joinedAt: '2026-06-18', eventId: event.id },
        { id: 'gst_102', name: 'Marcus Sterling Jr.', email: 'mster@gmail.com', joinedAt: '2026-06-17', eventId: event.id }
      ]);

      // 3. Fetch Event Analytics
      setIsAnalyticsLoading(true);
      try {
        const analyticsRes = await fetch(`/api/events/${event.id}/analytics`, {
          headers: {
            'Authorization': `Bearer ${currentUser.id}`
          }
        });
        if (analyticsRes.ok) {
          const aData = await analyticsRes.json();
          setAnalyticsData(aData);
        }
      } catch (err) {
        console.error('Failed to fetch event analytics trend:', err);
      } finally {
        setIsAnalyticsLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [event.id]);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/event/${event.id}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Event landing link copied to clipboard!');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        // Wrap reader in promise for serial uploads
        await new Promise<void>((resolve) => {
          reader.onloadend = async () => {
            const base64Data = reader.result as string;
            const size = file.size;
            
            const res = await fetch('/api/photos/upload', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.id}`
              },
              body: JSON.stringify({
                eventId: event.id,
                fileName: file.name,
                fileData: base64Data,
                size,
                tags: ['upload', file.name.split('.')[1] || 'img']
              })
            });
            const data = await res.json();
            if (res.status !== 200) {
              alert(data.error || 'Upload error');
            } else {
              setPhotosList(prev => [data, ...prev]);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      
      // update parental triggers
      const updatedEvent = { ...event, totalPhotos: photosList.length + files.length };
      onEventUpdated(updatedEvent);
    } catch (err) {
      console.error(err);
      alert('Upload pipeline exception');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if(!confirm('Are you absolutely sure you want to delete this photo from cloud R2?')) return;
    try {
      const res = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        setPhotosList(prev => prev.filter(p => p.id !== id));
        const updatedEvent = { ...event, totalPhotos: Math.max(0, event.totalPhotos - 1) };
        onEventUpdated(updatedEvent);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBestShotToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}/best-shot`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setPhotosList(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerFTPSManualSync = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ftp/sync-trigger', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ eventId: event.id })
      });
      const data = await res.json();
      if (data.success) {
        alert('FTPS Live Synchronizer complete! Loaded 3 pictures from network camera.');
        fetchEventData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          name,
          location,
          description,
          downloadsLimit,
          expiryDate: expiryDate || undefined,
          retentionPeriodDays: retentionPeriodDays ? parseInt(retentionPeriodDays.toString()) : undefined,
          customBranding: {
            ...event.customBranding,
            watermarkText,
            enableWatermark,
            logo: watermarkLogo
          }
        })
      });
      const data = await res.json();
      onEventUpdated(data);
      alert('Event controls updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFolderUploadSim = async () => {
    const folderRes = await fetch('/api/photos/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.id}`
      },
      body: JSON.stringify({ eventId: event.id, count: 4 })
    });
    if (folderRes.ok) {
      alert('Fast Bulk Folder Simulation Complete! Injected 4 mock photoshoot views.');
      fetchEventData();
    }
  };

  const totalEventBytes = photosList.reduce((sum, p) => sum + p.size, 0);

  return (
    <div className="space-y-6">
      
      {/* Detail view control header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onBack}
            className="p-2 border border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold text-slate-500">
              Photographer Control Rail
            </span>
            <h2 className="text-xl font-bold font-display mt-0.5">{event.name}</h2>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all text-slate-800 dark:text-slate-100"
          >
            <Copy className="w-4 h-4" />
            Copy Event Link
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-4.5 py-2 bg-rose-600 hover:bg-rose-750 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload Pictures
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            multiple
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Main detail pages tabs */}
      <div className="flex gap-1.5 bg-slate-200/60 dark:bg-slate-900 border-b border-slate-200/20 p-1 rounded-xl w-max">
        {[
          { id: 'overview', icon: Layers, label: 'Overview' },
          { id: 'photos', icon: Eye, label: `Photos (${photosList.length})` },
          { id: 'guests', icon: Users, label: `Guests (${guestsList.length})` },
          { id: 'analytics', icon: BarChart2, label: 'Analytics' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-550 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <IconComp className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
          <span className="text-xs font-mono text-slate-450 uppercase">Synching event metadata records...</span>
        </div>
      ) : (
        /* Sub pages components */
        <div className="space-y-6">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Event credentials summaries */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-base font-bold font-display uppercase tracking-widest text-slate-400">Project Description</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">{description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-2xs font-bold text-slate-400 block uppercase tracking-wider">Storage allocation</span>
                    <span className="text-lg font-bold block mt-1">{(totalEventBytes / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-2xs font-bold text-slate-400 block uppercase tracking-wider">Custom Watermarking</span>
                    <span className="text-sm font-semibold block mt-1.5 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${enableWatermark ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {enableWatermark ? watermarkText || 'Active Text' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* FTPS Hot Sync camera folder */}
                <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold font-display flex items-center gap-1.5">
                      <Layers className="w-4.5 h-4.5 text-rose-450 animate-pulse" />
                      FTPS Live Camera Synchronization
                    </h4>
                    <p className="text-3xs text-slate-400 mt-0.5">Integrate direct cellular hotspots on camera bodies to sync live RAW clicks</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTriggerFTPSManualSync}
                    className="p-2.5 px-4 bg-rose-650 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl flex items-center gap-1 uppercase transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Manually Trigger Hot Scan
                  </button>
                </div>

                {/* Quick actions for simulations */}
                <div className="space-y-2">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Sandbox Fast Uploaders</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleFolderUploadSim}
                      className="px-4 py-2 border border-slate-350 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                    >
                      <FolderUp className="w-4 h-4 text-blue-500" />
                      Simulate Folder Upload
                    </button>
                  </div>
                </div>

              </div>

              {/* QR Signages Cards */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <EventQRCode 
                  eventId={event.id} 
                  eventName={event.name} 
                  className="shadow-sm border border-slate-200 dark:border-slate-800"
                />

                <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="text-center space-y-3">
                    <span className="text-2xs font-bold text-rose-500 uppercase tracking-widest font-mono">Live Poster Studio</span>
                    <p className="text-3xs text-slate-450 dark:text-slate-400">Design beautiful, high-resolution signage handouts with custom themes and calls-to-action.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPosterModalOpen(true)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/10"
                    >
                      <QrCode className="w-4 h-4" />
                      Open Live Poster Designer
                    </button>
                    <button
                      type="button"
                      onClick={downloadPosterAsImage}
                      disabled={!qrCodeDataUrl || isGeneratingPoster}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-850 dark:hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      {isGeneratingPoster ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Fast Download Default Poster
                    </button>
                  </div>
                </div>

                {qrCodeDataUrl && (
                  <PrintablePoster 
                    event={event} 
                    theme={posterTheme} 
                    qrCodeDataUrl={qrCodeDataUrl}
                  />
                )}
              </div>

            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">{photosList.length} photos indexed on R2 servers</span>
                  {photosList.length > 0 && (
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.length === photosList.length && photosList.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhotoIds(photosList.map(p => p.id));
                          } else {
                            setSelectedPhotoIds([]);
                          }
                        }}
                        className="w-4 h-4 text-rose-500 bg-slate-100 rounded focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                      Select All ({selectedPhotoIds.length}/{photosList.length})
                    </label>
                  )}
                </div>

                {selectedPhotoIds.length > 0 && (
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-slate-200/60 pt-3 md:pt-0">
                    <span className="text-2xs font-mono text-slate-500 dark:text-slate-400">
                      <strong>{selectedPhotoIds.length}</strong> selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoIds([])}
                        className="px-3 py-1.5 border border-slate-250 dark:border-slate-850 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-[10px] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={downloadSelectedAsZip}
                        disabled={isZipping}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[10px] flex items-center gap-1.5 shadow-md shadow-rose-600/10 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isZipping ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Packaging {zipProgress}%</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-3 h-3" />
                            <span>Download Selection as ZIP ({selectedPhotoIds.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {photosList.length === 0 ? (
                <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-950/30 border border-dashed border-slate-300 dark:border-slate-850 rounded-3xl space-y-4">
                  <div className="inline-flex p-4 bg-slate-150 dark:bg-slate-900 text-slate-400 rounded-full">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">No photos uploaded yet</h4>
                    <p className="text-2xs text-slate-400 mt-0.5">Drag-and-drop pictures or select multiple file upload tags at the top.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  {photosList.map((pho) => (
                    <div 
                      key={pho.id} 
                      className={`group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border aspect-square shadow-sm flex flex-col justify-end transition-all duration-300 ${
                        selectedPhotoIds.includes(pho.id) 
                          ? 'ring-2 ring-rose-500 border-rose-500 scale-[0.98]' 
                          : 'border-slate-205 dark:border-slate-850'
                      }`}
                    >
                      {/* Checkbox selector overlay */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <input
                          type="checkbox"
                          checked={selectedPhotoIds.includes(pho.id)}
                          onChange={() => togglePhotoSelection(pho.id)}
                          className="w-4 h-4 rounded text-rose-500 border-2 border-white/80 focus:ring-rose-500 bg-slate-950/40 backdrop-blur-xs cursor-pointer shadow-sm checked:bg-rose-500 checked:border-rose-500 transition-all"
                        />
                      </div>

                      <img src={pho.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      
                      {/* Bounding box hover overlays */}
                      {pho.faceDetections.map((face, fi) => (
                        <div 
                          key={fi}
                          className="absolute border-2 border-emerald-500 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            left: `${face.x}%`,
                            top: `${face.y}%`,
                            width: `${face.width}%`,
                            height: `${face.height}%`
                          }}
                        >
                          <span className="absolute top-[-15px] left-0 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded-sm shadow">
                            Face {Math.floor(face.confidence * 100)}%
                          </span>
                        </div>
                      ))}

                      {/* Controls bar */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                        <div className="flex justify-between items-center pl-8">
                          <button
                            type="button"
                            onClick={() => handleBestShotToggle(pho.id)}
                            className="p-1 bg-black/40 hover:bg-black/80 rounded"
                          >
                            <Award className={`w-3.5 h-3.5 ${pho.isBestShot ? 'text-amber-500 fill-amber-500' : 'text-white'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(pho.id)}
                            className="p-1 bg-rose-600/80 hover:bg-rose-700 rounded text-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-white space-y-1">
                          <p className="text-[10px] font-mono leading-none">ID: {pho.id}</p>
                          <div className="flex flex-wrap gap-1 leading-none mt-1">
                            {pho.tags.slice(0, 3).map((t, ti) => (
                              <span key={ti} className="bg-white/10 text-white text-[8px] rounded px-1">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-405 uppercase tracking-wider font-display">
                    <th className="p-4 pl-6">Guest contact name</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right pr-6">Status ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                  {guestsList.map((gst) => (
                    <tr key={gst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                      <td className="p-4 pl-6 font-semibold font-display">{gst.name}</td>
                      <td className="p-4 font-mono text-xs">{gst.email || gst.phone || 'anonymous'}</td>
                      <td className="p-4 text-xs text-slate-400 font-mono">{gst.joinedAt}</td>
                      <td className="p-4 text-right pr-6 font-mono text-xs text-slate-500">{gst.id}</td>
                    </tr>
                  ))}
                  {guestsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 text-xs font-mono">No active guests found for this event index range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Dynamic Recharts Search Trends Block */}
              <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-sm font-display flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                      <BarChart2 className="w-4.5 h-4.5 text-rose-500" />
                      Guest Search & Scanning Trends
                    </h4>
                    <p className="text-3xs text-slate-450 dark:text-slate-400 mt-0.5">
                      Daily audit logs of guest face searches, successful matching ratios, and unmatched profiles
                    </p>
                  </div>
                  
                  {isAnalyticsLoading ? (
                    <div className="text-2xs font-mono text-slate-450 animate-pulse">Loading trends...</div>
                  ) : (
                    <div className="flex flex-wrap gap-4 text-2xs font-mono p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-2xl">
                      <div>Total Scans: <strong className="text-slate-800 dark:text-slate-100">{analyticsData?.totalSearches ?? 0}</strong></div>
                      <div>Successful: <strong className="text-emerald-500">{analyticsData?.successfulSearches ?? 0}</strong></div>
                      <div>No Match: <strong className="text-rose-500">{analyticsData?.unsuccessfulSearches ?? 0}</strong></div>
                    </div>
                  )}
                </div>

                <div className="w-full h-80 pt-2">
                  {analyticsData?.trend && analyticsData.trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.trend} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-850/60" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false}
                          tickFormatter={(val) => {
                            try {
                              const p = val.split('-');
                              if (p.length === 3) {
                                const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return `${m[parseInt(p[1]) - 1]} ${p[2]}`;
                              }
                            } catch (e) {}
                            return val;
                          }}
                        />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                        <Line 
                          name="Total Scanning Logs" 
                          type="monotone" 
                          dataKey="searches" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          activeDot={{ r: 6 }}
                          dot={{ r: 3 }}
                        />
                        <Line 
                          name="Matches Discovered" 
                          type="monotone" 
                          dataKey="success" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          dot={{ r: 2 }}
                        />
                        <Line 
                          name="Unsuccessful Conversions" 
                          type="monotone" 
                          dataKey="failed" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-10">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">No recent scan audits compile ready</p>
                      <p className="text-3xs text-slate-405 leading-relaxed">Guests need to complete selfie search matches to catalog real-time timeline charts.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Traffic Metrics */}
              <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm font-display flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  <BarChart2 className="w-4.5 h-4.5 text-blue-500" />
                  Performance Conversion
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-150 dark:border-slate-850 rounded-2xl">
                    <span className="text-3xl font-extrabold font-display block text-rose-500">
                      {analyticsData?.totalSearches ?? 142}
                    </span>
                    <span className="text-3xs text-slate-405 uppercase font-bold mt-1 block">Incremental selfie searches</span>
                  </div>
                  <div className="p-4 border border-slate-150 dark:border-slate-850 rounded-2xl">
                    <span className="text-3xl font-extrabold font-display block text-blue-500">
                      {analyticsData?.totalSearches ? Math.round(((analyticsData.successfulSearches || 0) / analyticsData.totalSearches) * 100) : 82}%
                    </span>
                    <span className="text-3xs text-slate-405 uppercase font-bold mt-1 block">Average Match conversion</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-500">
                      <span>Conversion Success Rate</span>
                      <span>{analyticsData?.successfulSearches ?? 12} matches / {analyticsData?.totalSearches ?? 15} searches</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ 
                          width: `${analyticsData?.totalSearches ? ((analyticsData.successfulSearches || 0) / analyticsData.totalSearches) * 100 : 80}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tag clouds */}
              <div className="p-6 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h4 className="font-bold text-sm font-display flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
                  <Layers className="w-4.5 h-4.5 text-rose-500" />
                  Face Tag indexes
                </h4>
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { label: 'smiling', count: 12 },
                    { label: 'glasses', count: 9 },
                    { label: 'brunette', count: 6 },
                    { label: 'female', count: 18 },
                    { label: 'male', count: 14 },
                    { label: 'joyful', count: 11 },
                    { label: 'wedding', count: 8 },
                    { label: 'outdoor', count: 7 }
                  ].map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/50 dark:border-slate-900 rounded-full text-xs font-semibold flex items-center gap-1"
                    >
                      <span>#{tag.label}</span>
                      <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-400 font-mono px-1 rounded-full">{tag.count}</span>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-850 p-6 sm:p-8 rounded-3xl shadow-sm max-w-2xl">
              <form onSubmit={handleSettingsSubmit} className="space-y-6">
                
                <div className="space-y-3">
                  <h3 className="font-bold text-sm font-display uppercase tracking-wider text-slate-400">Modify Event metadata</h3>
                  
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Location</label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Download Limits</label>
                      <input 
                        type="number" 
                        value={downloadsLimit}
                        onChange={(e) => setDownloadsLimit(parseInt(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-850" />

                {/* Expiry & Retention Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="font-bold text-sm font-display uppercase tracking-wider text-slate-400">Storage, Retention & Expiry Rules</h3>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-150 dark:border-slate-850">
                    <p className="text-3xs text-slate-450 dark:text-slate-400 leading-relaxed mb-4">
                      Configure when guest selfie search links expire, and when server-side cron cleanups should move uploaded assets into an archived/offline state.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Expiry Date</label>
                        <input 
                          type="date"
                          value={expiryDate ? expiryDate.split('T')[0] : ''}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Auto-Retention Buffer (Days)</label>
                        <input 
                          type="number"
                          min="1"
                          max="365"
                          value={retentionPeriodDays}
                          onChange={(e) => setRetentionPeriodDays(parseInt(e.target.value) || 30)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-850" />

                {/* branding watermarking controls */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm font-display uppercase tracking-wider text-slate-400">Custom Branding & Watermarking</h3>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="enableWatermark"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      className="w-4 h-4 text-rose-500 border-slate-300 dark:border-slate-800 rounded focus:ring-rose-500"
                    />
                    <label htmlFor="enableWatermark" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enable watermark protection overlay on thumbnail previews
                    </label>
                  </div>

                   {enableWatermark && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Watermark Overlay Text</label>
                        <input 
                          type="text" 
                          placeholder="PhotoSeek AI • Custom Brand Text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-xl text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Customize Photographer Logo Watermark</label>
                        <div className="space-y-3">
                          {watermarkLogo ? (
                            <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                              <img src={watermarkLogo} className="w-12 h-12 object-contain bg-slate-200 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-800" alt="Photographer logo preview" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-500 font-mono truncate">Logo image loaded</p>
                                <button 
                                  type="button"
                                  onClick={() => setWatermarkLogo('')}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest mt-0.5 cursor-pointer block"
                                >
                                  Remove Logo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              No active signature logo selected. Watermark text only will be rendered.
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              id="watermarkLogoUploader"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setWatermarkLogo(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                            <label 
                              htmlFor="watermarkLogoUploader"
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 font-bold text-2xs uppercase tracking-wider rounded-lg cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                            >
                              Choose Logo Image...
                            </label>

                            <input 
                              type="text"
                              placeholder="Or paste external logo URL"
                              value={watermarkLogo.startsWith('data:') ? '' : watermarkLogo}
                              onChange={(e) => setWatermarkLogo(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-lg text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submits */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-650/10 transition-all uppercase tracking-wide"
                  >
                    Save settings changes
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>
      )}

      {/* LIVE POSTER STUDIO MODAL */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row">
            
            {/* Customizer Sidebar */}
            <div className="p-6 md:p-8 flex-1 border-r border-slate-100 dark:border-slate-800/80 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded-full font-mono uppercase font-bold">
                    Interactive Tools
                  </span>
                  <h3 className="text-xl font-bold font-display mt-1">Live Poster Studio</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-400">Design beautiful, high-resolution signage handouts for table easels or welcome check-ins.</p>
                </div>
                <button 
                  onClick={() => setIsPosterModalOpen(false)}
                  className="md:hidden p-1.5 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Input 1: Poster Title */}
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Heading Title</label>
                  <input 
                    type="text" 
                    value={posterTitle} 
                    onChange={(e) => setPosterTitle(e.target.value)}
                    placeholder="Event Name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Input 2: Subtitle Instruction */}
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Instruction Subtitle</label>
                  <textarea 
                    value={posterSubtitle} 
                    onChange={(e) => setPosterSubtitle(e.target.value)}
                    placeholder="Scan this code with your phone camera..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Input 3: Accent Theme Theme */}
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Accent Brand Color</label>
                  <div className="flex gap-3 pt-1">
                    {[
                      { id: 'rose', name: 'Rose Petals', color: 'bg-rose-500' },
                      { id: 'slate', name: 'Cosmic Slate', color: 'bg-slate-700' },
                      { id: 'emerald', name: 'Forest Mint', color: 'bg-emerald-500' },
                      { id: 'amber', name: 'Sunset Bronze', color: 'bg-amber-500' }
                    ].map((thm) => (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => setPosterTheme(thm.id as any)}
                        className={`flex-1 p-2 border rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] font-bold ${
                          posterTheme === thm.id 
                            ? 'border-slate-900 bg-slate-900 dark:border-white dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' 
                            : 'border-slate-200 bg-white dark:bg-slate-850 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${thm.color}`} />
                        {thm.name.split(' ')[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input 4: Selfie Toggle */}
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="includeSelfie"
                    checked={includeSelfieSearch}
                    onChange={(e) => setIncludeSelfieSearch(e.target.checked)}
                    className="w-4.5 h-4.5 text-rose-500 border-slate-300 rounded focus:ring-rose-500"
                  />
                  <div className="leading-tight">
                    <label htmlFor="includeSelfie" className="text-xs font-semibold text-slate-850 dark:text-slate-150 block">
                      Promote PhotoSeek Selfie Search
                    </label>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Let guests snap a fast portrait inside their mobile browser to match images</span>
                  </div>
                </div>

                {/* Download and print buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPosterModalOpen(false)}
                    className="flex-1 py-3 border border-slate-300 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wide"
                  >
                    Close Studio
                  </button>
                  <button
                    type="button"
                    onClick={downloadPosterAsImage}
                    disabled={isGeneratingPoster || !qrCodeDataUrl}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 uppercase tracking-wide shadow-lg shadow-rose-600/10"
                  >
                    {isGeneratingPoster ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Generate Poster
                  </button>
                </div>
              </div>
            </div>

            {/* Poster Blueprint Live Mockup Panel */}
            <div className="p-6 md:p-8 bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center relative min-w-[360px] md:w-[400px]">
              <button 
                onClick={() => setIsPosterModalOpen(false)}
                className="hidden md:block absolute top-4 right-4 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-650 rounded-full shadow-sm hover:shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="text-3xs uppercase tracking-widest font-mono font-bold text-slate-400 mb-4 block">
                🔴 Poster Live Canvas Preview (3:4 ratio)
              </span>

              {/* Styled Mockup poster matching selection */}
              <div className={`w-full max-w-[310px] aspect-[3/4] border-8 rounded-2xl bg-white p-5 flex flex-col justify-between shadow-2xl relative select-none text-slate-900 transition-all ${
                posterTheme === 'rose' ? 'border-rose-600/10 shadow-rose-500/5' :
                posterTheme === 'emerald' ? 'border-emerald-600/10 shadow-emerald-500/5' :
                posterTheme === 'amber' ? 'border-amber-600/10 shadow-amber-500/5' :
                'border-slate-900/10 shadow-slate-900/5'
              }`}>
                {/* Accent mini corner highlights */}
                <div className={`absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 rounded-tl ${
                  posterTheme === 'rose' ? 'border-rose-600' :
                  posterTheme === 'emerald' ? 'border-emerald-500' :
                  posterTheme === 'amber' ? 'border-amber-500' :
                  'border-slate-800'
                }`} />
                <div className={`absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 rounded-tr ${
                  posterTheme === 'rose' ? 'border-rose-600' :
                  posterTheme === 'emerald' ? 'border-emerald-500' :
                  posterTheme === 'amber' ? 'border-amber-500' :
                  'border-slate-800'
                }`} />
                <div className={`absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 rounded-bl ${
                  posterTheme === 'rose' ? 'border-rose-600' :
                  posterTheme === 'emerald' ? 'border-emerald-500' :
                  posterTheme === 'amber' ? 'border-amber-500' :
                  'border-slate-800'
                }`} />
                <div className={`absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 rounded-br ${
                  posterTheme === 'rose' ? 'border-rose-600' :
                  posterTheme === 'emerald' ? 'border-emerald-500' :
                  posterTheme === 'amber' ? 'border-amber-500' :
                  'border-slate-800'
                }`} />

                {/* Elegant Branding Header */}
                <div className="text-center">
                  <span className={`text-[10px] font-extrabold tracking-widest ${
                    posterTheme === 'rose' ? 'text-rose-600' :
                    posterTheme === 'emerald' ? 'text-emerald-700' :
                    posterTheme === 'amber' ? 'text-amber-700' :
                    'text-slate-800'
                  }`}>
                    PHOTOSEEK AI
                  </span>
                  <span className="block text-[6px] font-mono tracking-widest text-slate-400 font-bold uppercase mt-0.5">
                    • MOBILE GALLERY GATEWAY •
                  </span>
                </div>

                {/* Title and location */}
                <div className="text-center mt-2">
                  <h4 className="text-sm font-bold font-display uppercase leading-tight tracking-tight text-slate-900 line-clamp-2">
                    {posterTitle || event.name}
                  </h4>
                  <span className="text-[7px] text-slate-500 block font-semibold mt-0.5 font-mono">
                    📍 {event.location || 'Napa Valley, CA'}
                  </span>
                </div>

                {/* Instruction */}
                <div className="text-center mt-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-800 block">
                    SCAN TO FIND YOUR CLICKS
                  </span>
                  <span className="text-[6px] text-slate-400 block mt-0.5 font-sans leading-relaxed line-clamp-2">
                    {posterSubtitle || 'Scan this code with your phone camera to view matching pictures.'}
                  </span>

                  {/* QR code container */}
                  <div className="w-24 h-24 bg-white rounded-lg mx-auto mt-2 border border-slate-150 p-1.5 flex items-center justify-center shadow-inner relative">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Selfie Search Banner */}
                {includeSelfieSearch && (
                  <div className="text-center mt-2 pt-2 border-t border-dashed border-slate-100">
                    <span className={`text-[7px] font-extrabold tracking-wider block ${
                      posterTheme === 'rose' ? 'text-rose-600' :
                      posterTheme === 'emerald' ? 'text-emerald-700' :
                      posterTheme === 'amber' ? 'text-amber-700' :
                      'text-slate-800'
                    }`}>
                      ✨ POWERED BY AI PHOTOSEEK ✨
                    </span>
                    <span className="text-[6px] text-slate-500 block font-medium mt-0.5">
                      Upload a simple selfie for direct facial match
                    </span>
                  </div>
                )}

                {/* footer terms */}
                <div className="text-center pt-2 mt-2 border-t border-slate-100">
                  <span className="text-[5px] text-slate-405 font-mono font-bold uppercase tracking-wider block">
                    SECURE CLOUDFLARE R2 DATA STORAGE • ALL PREVIEWS WATERMARKED
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
