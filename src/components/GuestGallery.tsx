/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Search, RefreshCw, Download, 
  Heart, Share2, Mail, Phone, User, Sparkles, 
  Maximize2, X, Check, Globe, Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { Event, Photo } from '../types';

interface GuestGalleryProps {
  event: Event;
  onBackToLanding: () => void;
}

export default function GuestGallery({ event, onBackToLanding }: GuestGalleryProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<(Photo & { matchScore?: number })[]>([]);
  const [selfieTags, setSelfieTags] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [activePreviewPhoto, setActivePreviewPhoto] = useState<(Photo & { matchScore?: number }) | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
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
      const folderName = `PhotoSeek_${event.name.replace(/\s+/g, '_')}`;
      const folder = zip.folder(folderName);
      
      for (let i = 0; i < selectedPhotoIds.length; i++) {
        const pId = selectedPhotoIds[i];
        const photo = matchedPhotos.find(p => p.id === pId);
        if (!photo) continue;

        // Perform download audit log
        try {
          await fetch('/api/downloads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoId: pId,
              eventId: event.id,
              userEmail: email || 'anonymous@guest.com'
            })
          });
        } catch (e) {
          console.warn('Audit download registration error:', pId, e);
        }

        // Fetch image raw buffer
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
      link.download = `${folderName}_GuestSelection.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP compilation exception:', err);
      alert('An error occurred during client-side ZIP packaging.');
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Webcam Camera
  const startCamera = async () => {
    setCameraActive(true);
    setSelfie(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn('Camera access blocked inside preview iframe. Falling back to upload.', e);
      alert('Camera access blocked. Please upload a selfie file or check browser permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Capture image frame
  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelfie(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfie(reader.result as string);
        setCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfie) {
      alert('Please snap or upload a selfie first');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/photos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          selfieBase64: selfie,
          name: name || 'Guest User',
          email,
          phone
        })
      });
      const data = await res.json();
      setMatchedPhotos(data.results || []);
      setSelfieTags(data.selfieTags || []);
      setSelectedPhotoIds([]);
      setHasSearched(true);
    } catch (err) {
      console.error(err);
      alert('Failed to connect to search pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (photoId: string, photoUrl: string) => {
    // 1. Audit Download
    await fetch('/api/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        eventId: event.id,
        userEmail: email || 'anonymous@guest.com'
      })
    });

    // 2. Open / Trigger simulated download
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `PhotoSeek_${photoId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      
      {/* Event Header Card */}
      <div className="p-6 rounded-2xl glass-panel shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-[10px] bg-rose-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest font-mono">
            LIVE EVENTS SEARCH
          </span>
          <h2 className="text-2xl font-bold font-display mt-2">{event.name}</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
            📍 {event.location} &bull; 🗓 {event.date}
          </p>
        </div>
        <button 
          onClick={onBackToLanding}
          className="px-4 py-2 border border-slate-350 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold"
        >
          Exit to Landing Page
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column - Selfie Scanner Controller */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold font-display">AI face Finder Console</h3>
            <p className="text-2xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Snap a selfie to instantly index biometric matches</p>
          </div>

          <form onSubmit={handleSearchTrigger} className="space-y-4">
            
            {/* Input credentials */}
            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 tracking-wider mb-1">Your Full Name (Required)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Tiffany Alvarez" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-850 rounded-xl text-xs font-medium focus:ring-rose-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 tracking-wider mb-1">Email (Optional)</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="tiffany@alvarez.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-850 rounded-xl text-xs font-medium focus:ring-rose-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 tracking-wider mb-1">Phone (Optional)</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="+1-555-0144"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-850 rounded-xl text-xs font-medium focus:ring-rose-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Camera / Capture container */}
            <div className="relative bg-slate-100 dark:bg-slate-950 rounded-2xl aspect-video overflow-hidden border border-slate-205 dark:border-slate-850 flex items-center justify-center">
              
              {cameraActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
                    playsInline 
                    muted 
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                    <button
                      type="button"
                      onClick={captureSelfie}
                      className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg flex items-center justify-center"
                    >
                      <Camera className="w-5 h-5 fill-white" />
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3.5 py-1 bg-slate-900/80 text-white text-2xs font-semibold rounded-full hover:bg-slate-950"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : selfie ? (
                <>
                  <img src={selfie} alt="Selfie preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelfie(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 rounded-full">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Selfie Required</p>
                    <p className="text-3xs text-slate-500 mt-0.5">Use your live webcam or choose an photo attachment.</p>
                  </div>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Media Upload Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraActive}
                className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Camera className="w-4 h-4" />
                Live Camera Snap
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Upload className="w-4 h-4" />
                Browse File
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Trigger Matches Search Button */}
            <button
              type="submit"
              disabled={isLoading || !selfie}
              className="w-full py-3 bg-slate-950 dark:bg-rose-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Facial Descriptors...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Index My Photos
                </>
              )}
            </button>

          </form>

        </div>

        {/* Right column - Real-time matched private gallery layout */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850">
            <div>
              <h4 className="font-bold text-sm font-display flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-rose-500 animate-pulse" />
                Isolated Private Gallery View
              </h4>
              <p className="text-2xs text-slate-400 mt-0.5">Other stranger guest matches remain strictly private (Biometric Isolation)</p>
            </div>
            {hasSearched && (
              <span className="px-3 py-1 bg-rose-500 text-white font-mono text-[10px] font-bold rounded-full">
                {matchedPhotos.length} Matches Found
              </span>
            )}
          </div>

          {!hasSearched ? (
            /* Starter welcome guide card */
            <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="inline-flex p-4 bg-rose-500/10 text-rose-500 rounded-full">
                <Sparkles className="w-8 h-8 animate-pulse text-rose-500 fill-rose-500/20" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm font-display">Waiting for Selfie Credentials</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Provide your credential tags on the console and snap/upload your face to index the live event directory.
                </p>
              </div>
            </div>
          ) : matchedPhotos.length === 0 ? (
            /* No results template */
            <div className="py-20 text-center space-y-4 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
              <div className="inline-flex p-4 bg-amber-500/10 text-amber-550 rounded-full">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-550 font-display">Zero Matches Spotted</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Our pipeline scan returned no matching features above the similarity threshold.
                </p>
              </div>
              {selfieTags.length > 0 && (
                <div className="pt-4 max-w-xs mx-auto">
                  <span className="text-2xs font-bold uppercase block text-slate-500 tracking-wider mb-2">Selfie properties analyzed</span>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {selfieTags.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-2xs font-mono rounded text-slate-400">#{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Masonry photo results grid */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850/80">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-bold text-slate-50 relative uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
                    Biometric tags matched
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selfieTags.map((t, ti) => (
                      <span key={ti} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] px-2 py-0.5 rounded font-mono">#{t}</span>
                    ))}
                  </div>
                </div>

                {matchedPhotos.length > 0 && (
                  <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between border-t sm:border-0 border-slate-200/60 pt-3 sm:pt-0">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.length === matchedPhotos.length && matchedPhotos.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPhotoIds(matchedPhotos.map(p => p.id));
                          } else {
                            setSelectedPhotoIds([]);
                          }
                        }}
                        className="w-4 h-4 text-rose-500 bg-slate-100 rounded focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                      Select All ({selectedPhotoIds.length}/{matchedPhotos.length})
                    </label>
                  </div>
                )}
              </div>

              {selectedPhotoIds.length > 0 && (
                <div className="bg-gradient-to-r from-rose-500/10 to-rose-600/5 dark:from-rose-500/5 dark:to-transparent border border-rose-200/60 dark:border-rose-950/40 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm animate-fade-in">
                  <div className="text-xs text-slate-700 dark:text-slate-250 leading-tight">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{selectedPhotoIds.length}</span> individual matched photos selected for download package.
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Engineered with asynchronous client-side CPU grouping.</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedPhotoIds([])}
                      className="px-3.5 py-1.5 border border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[11px] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      onClick={downloadSelectedAsZip}
                      disabled={isZipping}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isZipping ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Compacting ZIP {zipProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Download ZIP ({selectedPhotoIds.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="columns-2 sm:columns-3 gap-4 space-y-4">
                {matchedPhotos.map((item) => (
                  <div 
                    key={item.id}
                    className={`relative group rounded-xl overflow-hidden border bg-white dark:bg-slate-900 break-inside-avoid shadow-sm hover:shadow-lg transition-all duration-300 ${
                      selectedPhotoIds.includes(item.id) 
                        ? 'ring-2 ring-rose-500 border-rose-500 scale-[0.98]' 
                        : 'border-slate-200 dark:border-slate-850'
                    }`}
                  >
                    {/* Absolute selection checkmark indicator */}
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <input
                        type="checkbox"
                        checked={selectedPhotoIds.includes(item.id)}
                        onChange={() => togglePhotoSelection(item.id)}
                        className="w-4.5 h-4.5 rounded text-rose-500 border-2 border-white/80 focus:ring-rose-500 bg-slate-950/40 backdrop-blur-xs cursor-pointer shadow-sm checked:bg-rose-500 checked:border-rose-500 transition-all"
                      />
                    </div>

                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-auto object-cover display-block"
                    />

                    {/* Watermark preview overlay overlay */}
                    {event.customBranding?.enableWatermark && event.customBranding?.watermarkText && (
                      <div className="absolute inset-5 pointer-events-none flex items-center justify-center select-none rotate-[-25deg] opacity-[0.25] text-slate-900 font-extrabold text-[11px] uppercase tracking-widest text-center">
                        {event.customBranding.watermarkText}
                      </div>
                    )}

                    {/* Hover controls rail */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center pl-10">
                        <span className="bg-rose-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded">
                          AI: {Math.floor((item.matchScore || 0.8) * 100)}% Match
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          className="p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white transition-all"
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePreviewPhoto(item)}
                          className="flex-1 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-2xs font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(item.id, item.url)}
                          className="p-2 bg-white hover:bg-slate-100 rounded-xl text-slate-900 text-2xs font-semibold flex items-center justify-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen interactive preview dialog */}
      {activePreviewPhoto && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex gap-3 z-10">
            <button
              onClick={() => {
                alert('Mock share prompt successful! Shared onto your WhatsApp.');
              }}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg hover:bg-slate-700 flex items-center gap-1 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> WhatsApp Share
            </button>
            <button
              onClick={() => {
                alert('Simulated email receipt dispatched! Check your mail inbox.');
              }}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg hover:bg-slate-700 flex items-center gap-1 transition-all"
            >
              <Mail className="w-3.5 h-3.5" /> Send to Email
            </button>
            <button
              onClick={() => handleDownload(activePreviewPhoto.id, activePreviewPhoto.url)}
              className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 flex items-center gap-1 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> High-Res Download
            </button>
            <button 
              onClick={() => setActivePreviewPhoto(null)}
              className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
            <img 
              src={activePreviewPhoto.url} 
              alt="High resolution view" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {event.customBranding?.enableWatermark && event.customBranding?.watermarkText && (
              <div className="absolute inset-10 pointer-events-none flex items-center justify-center rotate-[-30deg] opacity-[0.3] text-orange-400 font-extrabold text-sm uppercase tracking-widest text-center select-none">
                {event.customBranding.watermarkText}
              </div>
            )}
            
            <div className="absolute bottom-[-45px] left-1/2 -translate-x-1/2 text-center text-slate-400 text-xs font-mono">
              Confidence index metric: {Math.floor((activePreviewPhoto.matchScore || 0.8) * 100)}% &bull; Size: {(activePreviewPhoto.size / (1024 * 1024)).toFixed(2)} MB &bull; Resolution: Auto
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
