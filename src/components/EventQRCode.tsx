/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Copy, Check, Sparkles, RefreshCw, Printer, Smile } from 'lucide-react';
import QRCode from 'qrcode';
import { Event } from '../types';

interface EventQRCodeProps {
  eventId: string;
  eventName: string;
  size?: number;
  className?: string;
}

export default function EventQRCode({ eventId, eventName, size = 256, className = "" }: EventQRCodeProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const eventUrl = `${window.location.origin}?event=${eventId}`;

  useEffect(() => {
    let active = true;
    const generate = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(eventUrl, {
          width: size * 2,
          margin: 1,
          color: {
            dark: '#0f172a', // Deep slate primary
            light: '#ffffff'
          }
        });
        if (active) {
          setQrSrc(dataUrl);
        }
      } catch (err) {
        console.error('QR Generation failed:', err);
      }
    };
    generate();
    return () => {
      active = false;
    };
  }, [eventId, eventUrl, size]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const downloadQRJustImage = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `QRCode_${eventName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex flex-col items-center p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl space-y-4 ${className}`} id="qr-code-utility">
      <div className="relative p-2.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
        {qrSrc ? (
          <img src={qrSrc} alt={`QR Code for ${eventName}`} className="w-44 h-44 object-contain rounded-lg" />
        ) : (
          <div className="w-44 h-44 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        )}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-rose-500 rounded-tl-sm" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-rose-500 rounded-tr-sm" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-rose-500 rounded-bl-sm" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-rose-500 rounded-br-sm" />
      </div>

      <div className="text-center">
        <p className="text-xs font-bold font-mono tracking-tight dark:text-slate-100 max-w-[200px] truncate">{eventName}</p>
        <span className="text-[10px] text-slate-450 dark:text-slate-400 block mt-0.5">Redirect: event={eventId}</span>
      </div>

      <div className="flex gap-2 w-full">
        <button
          onClick={handleCopyUrl}
          type="button"
          className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-3xs font-semibold flex items-center justify-center gap-1 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy URL
            </>
          )}
        </button>
        <button
          onClick={downloadQRJustImage}
          disabled={!qrSrc}
          type="button"
          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-2xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Highly customized Printable Poster template component matching requested parameters
interface PrintablePosterProps {
  event: Event;
  theme?: 'rose' | 'slate' | 'emerald' | 'amber';
  qrCodeDataUrl: string;
  onClose?: () => void;
}

export function PrintablePoster({ event, theme = 'rose', qrCodeDataUrl }: PrintablePosterProps) {
  const [title, setTitle] = useState(event.name);
  const [subtitle, setSubtitle] = useState('Scan to find and download your matching event photos instantly!');
  const [includeSelfie, setIncludeSelfie] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const themeColors = {
    rose: { primary: '#e11d48', bgLight: '#f8fafc', accent: '#fda4af', border: 'border-rose-100 dark:border-rose-950/40' },
    slate: { primary: '#0f172a', bgLight: '#f1f5f9', accent: '#cbd5e1', border: 'border-slate-100 dark:border-slate-800' },
    emerald: { primary: '#059669', bgLight: '#f0fdf4', accent: '#6ee7b7', border: 'border-emerald-100 dark:border-emerald-950/40' },
    amber: { primary: '#d97706', bgLight: '#fffbeb', accent: '#fde047', border: 'border-amber-100 dark:border-amber-950/40' }
  };

  const selectedTheme = themeColors[theme] || themeColors.rose;

  const handleDownloadPoster = async () => {
    if (!qrCodeDataUrl) return;
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw solid background with beautiful gradient tints
      const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, selectedTheme.bgLight);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 1600);

      // 2. Main structured vector borders
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 16;
      ctx.strokeRect(32, 32, 1200 - 64, 1600 - 64);

      // Color accent border highlight corners
      ctx.strokeStyle = selectedTheme.primary;
      ctx.lineWidth = 24;
      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(80, 48); ctx.lineTo(48, 48); ctx.lineTo(48, 80); ctx.stroke();
      // Top-Right corner
      ctx.beginPath();
      ctx.moveTo(1200 - 80, 48); ctx.lineTo(1200 - 48, 48); ctx.lineTo(1200 - 48, 80); ctx.stroke();
      // Bottom-Left corner
      ctx.beginPath();
      ctx.moveTo(80, 1600 - 48); ctx.lineTo(48, 1600 - 48); ctx.lineTo(48, 1600 - 80); ctx.stroke();
      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(1200 - 80, 1600 - 48); ctx.lineTo(1200 - 48, 1600 - 48); ctx.lineTo(1200 - 48, 1600 - 80); ctx.stroke();

      // 3. Top branding headers
      ctx.fillStyle = selectedTheme.primary;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PHOTOSEEK AI GALLERY', 600, 140);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('• SCAN CODE & INITIATE FACIAL DISCOVERY •', 600, 185);

      // 4. Hero Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 64px sans-serif';
      
      const titleStr = title || event.name;
      const maxLength = 28;
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

      // 5. Date and coordinates
      ctx.fillStyle = '#475569';
      ctx.font = '600 24px sans-serif';
      const locStr = event.location ? `📍 ${event.location}` : '';
      const dateStr = event.date ? `📅 ${new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'long' })}` : '';
      ctx.fillText(`${locStr}   ${dateStr}`.trim(), 600, 440);

      // Separation rule
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(350, 490);
      ctx.lineTo(850, 490);
      ctx.stroke();

      // 6. QR Code Instruction Callout
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('FIND YOUR PHOTOS!', 600, 580);

      // Framing the instruction block text
      ctx.fillStyle = '#475569';
      ctx.font = '500 24px sans-serif';
      
      const subWords = subtitle.split(' ');
      let currentSub = '';
      let subLines = [];
      for (const sw of subWords) {
        if ((currentSub + sw).length > 55) {
          subLines.push(currentSub.trim());
          currentSub = sw + ' ';
        } else {
          currentSub += sw + ' ';
        }
      }
      subLines.push(currentSub.trim());
      ctx.fillText(subLines[0], 600, 630);
      if (subLines[1]) ctx.fillText(subLines[1], 600, 670);

      // 7. Render QR Code image inside a rounded high contrast container card
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
          
          // Draw rounded card
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

      // 8. Selfie call to action detail section
      if (includeSelfie) {
        ctx.fillStyle = selectedTheme.primary;
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('✨ INSTANT AI SELFIE MATCH SPEED ✨', 600, 1300);

        ctx.fillStyle = '#475569';
        ctx.font = '500 22px sans-serif';
        ctx.fillText('Snap a fast reference selfie to immediately isolate photos featuring you!', 600, 1345);
      }

      // Link footer details
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Direct Entry Link: ${window.location.origin}?event=${event.id}`, 600, 1430);

      // Footnote
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('SECURE WATERMARKED PREVIEWS • SYSTEM POWERED BY SAAS NETWORKS', 600, 1515);

      // Convert canvas to image and trigger download
      const posterDataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = posterDataUrl;
      downloadLink.download = `Poster_${event.name.replace(/\s+/g, '_')}_Printable.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Poster rendering error:', err);
      alert('Error during canvas compression.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden p-6 space-y-6 shadow-md" id="printable-poster-editor">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Smile className={`w-5 h-5 text-rose-500`} />
          <h4 className="text-sm font-bold font-display text-slate-850 dark:text-slate-150">Printable Poster Customizer</h4>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Format: A3 High Resolution (3:4)</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catchy Poster Call-To-Action</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Change poster heading"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Instructions to Guest</label>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Subtext below the code"
          />
        </div>

        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850">
          <input
            type="checkbox"
            id="includeSelfieSearch"
            checked={includeSelfie}
            onChange={(e) => setIncludeSelfie(e.target.checked)}
            className="w-4.5 h-4.5 rounded text-rose-600 focus:ring-rose-500"
          />
          <div className="leading-tight">
            <label htmlFor="includeSelfieSearch" className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Incorporate "Selfie Search" highlight
            </label>
            <span className="text-[10px] text-slate-400 block mt-0.5">Prints a modern banner advertising instant camera match.</span>
          </div>
        </div>

        <button
          onClick={handleDownloadPoster}
          disabled={isGenerating || !qrCodeDataUrl}
          type="button"
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 uppercase tracking-wide transition-all shadow-md shadow-rose-600/10"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Printable Poster (PNG)
        </button>
      </div>
    </div>
  );
}
