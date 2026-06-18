/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Camera, Search, QrCode, UploadCloud, Users, Sparkles, 
  ArrowRight, Landmark, ShoppingBag, ShieldCheck, Download, 
  Tv, MessageSquare, Mail, Play, AlertCircle, Quote, Plus, Minus
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onLoginClick: (role?: 'photographer' | 'guest') => void;
  onExploreDemoEvent: (eventId: string) => void;
}

export default function LandingPage({ onLoginClick, onExploreDemoEvent }: LandingPageProps) {
  const [demoSelfie, setDemoSelfie] = useState<string | null>(null);
  const [isDemoMatching, setIsDemoMatching] = useState(false);
  const [demoMatched, setDemoMatched] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleDemoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDemoSelfie(reader.result as string);
        setIsDemoMatching(true);
        setDemoMatched(false);
        setTimeout(() => {
          setIsDemoMatching(false);
          setDemoMatched(true);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const faqs = [
    {
      q: "How does the AI face search matching work?",
      a: "When you upload event photos, our server-side pipeline detects multi-face coordinates. Guests open the event URL, snap a quick selfie, and our AI maps facial coordinates to generate a list of matches in under 3 seconds. Raw biometric signatures are prompt-matched and never persisted on disc."
    },
    {
      q: "What is the FTPS live camera synchronization?",
      a: "Perfect for live sporting, fashion, or wedding streams. Photographers configure our direct camera folder watcher or FTPS directory, and as fast as their camera uploads RAW file transfers, our background queue auto-registers, down-samples, applies watermarks, and adds them to live search."
    },
    {
      q: "Can I protect my photos with custom watermarks?",
      a: "Yes! High-tier plans let you fully white-label events. You can overlay custom watermark texts, custom logos, customize highlight primary/secondary colors, and regulate download limits or download locks."
    },
    {
      q: "Are the photos secure and GDPR compliant?",
      a: "Absolutely. We enforce Strict Row Level Security. Guests only see their matching photos in a private masonry gallery, keeping other guests private. We also support full deletion workflows to wipe user data cleanly."
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#080808] text-slate-800 dark:text-[#f3f0ea] transition-all font-sans">
      
      {/* Absolute floating lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 dark:bg-brand-500/5 rounded-full blur-3xl animate-pulse-slow -z-10" />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-brand-600/5 dark:bg-brand-600/5 rounded-full blur-3xl animate-pulse-slow -z-10" />

      {/* Navigation header */}
      <header className="sticky top-0 bg-[#fdfbf7]/80 dark:bg-[#0a0a0all]/85 backdrop-blur-md border-b border-[#e8e3d9] dark:border-slate-900 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#c5a028] dark:bg-[#aa820a] rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter font-display italic text-slate-900 dark:text-[#FAF7F2]">
              PhotoSeek <span className="font-sans text-xs font-bold not-italic px-2 py-0.5 border border-brand-500/30 rounded-full text-[#c5a028] ml-1 uppercase bg-brand-50/10">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-605 dark:text-slate-300 tracking-widest uppercase">
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-brand-500 transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-brand-500 transition-colors">Plans</a>
            <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onLoginClick('guest')}
              className="text-xs font-bold text-slate-700 dark:text-[#f3f0ea] hover:text-brand-500 dark:hover:text-brand-500 px-3 py-1.5 transition-all uppercase tracking-wider"
            >
              Enter Code
            </button>
            <button
              onClick={() => onLoginClick('photographer')}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-[#be9f4d] dark:hover:bg-[#c5a250] text-[#faf7f2] dark:text-[#0a0a0a] text-xs font-extrabold tracking-wider uppercase px-4.5 py-2.5 rounded-lg shadow-lg transition-all"
            >
              Studio Login
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Animated Background Blobs & Grid */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <motion.div 
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut'
          }}
          className="absolute top-1/4 left-10 md:left-20 w-72 h-72 rounded-full bg-brand-500/5 dark:bg-brand-500/5 blur-3xl -z-10 pointer-events-none"
        />

        <motion.div 
          animate={{
            x: [0, -25, 25, 0],
            y: [0, 25, -25, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut'
          }}
          className="absolute top-1/3 right-10 md:right-20 w-80 h-80 rounded-full bg-brand-600/3 dark:bg-brand-600/3 blur-3xl -z-10 pointer-events-none"
        />

        <motion.div 
          animate={{
            y: [0, -15, 15, 0],
            scale: [0.9, 1.05, 0.95, 0.9],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut'
          }}
          className="absolute bottom-10 left-1/3 w-60 h-60 rounded-full bg-slate-300/10 dark:bg-[#121212]/50 blur-3xl -z-10 pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative">
          
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#f5f0e6] dark:bg-[#aa820a]/10 text-[#aa820a] dark:text-[#be9f4d] rounded-full font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm select-none border border-[#e8e3d9]/60 dark:border-brand-600/20"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#c5a028] text-[#c5a028] animate-spin-slow" />
            Empowering Event Storytellers
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="text-4xl sm:text-7xl font-light font-display leading-[1.05] tracking-tight max-w-5xl mx-auto text-slate-900 dark:text-white"
          >
            Guest Photo Sharing, <span className="italic block font-serif font-medium bg-gradient-to-r from-[#be9f4d] via-[#d4af37] to-[#aa820a] bg-clip-text text-transparent bg-[length:200%_auto] animate-pulse">Refined by Facial Biometrics</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed font-sans"
          >
            Delight guests with immediate private gallery search results from your high-res uploads. No scrolling, no passwords, no login wall. Simple, secure, and ready under three seconds.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onLoginClick('photographer')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-[#aa820a] dark:hover:bg-[#be9f4d] text-white dark:text-[#0a0a0a] font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-lg shadow-xl shadow-brand-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Start Studio Trial
              <ArrowRight className="w-4 h-4 animate-bounce-horizontal" />
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#demo"
              className="w-full sm:w-auto bg-white/50 dark:bg-slate-900/60 hover:bg-[#f5f0e6] dark:hover:bg-slate-800 text-slate-705 dark:text-slate-200 border border-[#e8e3d9] dark:border-slate-800 font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-500" />
              Try Facing Demo
            </motion.a>
          </motion.div>

          {/* Large decorative search mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 50, delay: 0.6 }}
            className="pt-10 max-w-5xl mx-auto select-none"
          >
            <div className="relative group rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-transparent mix-blend-overlay pointer-events-none animate-pulse" />
              <img 
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200" 
                alt="PhotoSeek Dashboard Preview" 
                className="w-full h-auto rounded-xl md:rounded-2xl border border-slate-150 dark:border-slate-800/50"
              />
              {/* Floating matching prompt card */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.7 }}
                className="absolute bottom-8 left-8 bg-[#faf7f2]/95 dark:bg-[#0c0c0c]/95 backdrop-blur-md rounded-xl p-4 border border-[#e8e3d9] dark:border-slate-800 shadow-2xl hidden sm:flex items-center gap-4 ring-1 ring-black/5 animate-fade-in"
              >
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
                  alt="" 
                  className="w-12 h-12 rounded-lg object-cover border-2 border-brand-500 animate-pulse animate-spin-slow"
                />
                <div className="text-left">
                  <span className="text-[9px] text-[#aa820a] uppercase tracking-widest font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-brand-550 animate-spin-slow" /> Matches Discovered
                  </span>
                  <p className="text-xs font-bold mt-0.5 text-slate-900 dark:text-[#f3f0ea]">Tiffany Alvarez (4 files matched)</p>
                  <p className="text-[9px] text-[#be9f4d] font-mono mt-0.5">Biometric map confidence: 99.4%</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Stats counter strip */}
      <section className="py-10 bg-white dark:bg-[#0c0c0c]/40 border-y border-[#e8e3d9] dark:border-slate-900 text-center">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 font-display">
          <div>
            <span className="text-3xl md:text-5xl font-light text-brand-600 dark:text-[#be9f4d] block">4.8M+</span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-bold mt-1.5 block">Photos Synced</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-light text-[#4e7d96] block">1,200+</span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-bold mt-1.5 block">Premium Studios</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-light text-[#2d5a40] block">99.2%</span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-bold mt-1.5 block">Match Accuracy</span>
          </div>
          <div>
            <span className="text-3xl md:text-5xl font-light text-[#aa820a] block">&lt; 3.0s</span>
            <span className="text-[10px] text-slate-500 tracking-widest uppercase font-bold mt-1.5 block">Matching Latency</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold font-display">Engineered, High-Performance Features</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light">
            Crafted meticulously with the tools wedding photo agencies and concert promoters need to streamline delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-colors space-y-4">
            <div className="p-3 bg-rose-500/15 text-rose-500 rounded-xl max-w-max">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Instant AI Face Search</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              No login walls. Guests scan a unique code, capture a selfie directly, and immediately view matching high-res images in real time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors space-y-4">
            <div className="p-3 bg-blue-500/15 text-blue-500 rounded-xl max-w-max">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Dynamic QR Event Sharing</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              Generate customizable printed table signs, banners, or badges with built-in event routing. Scan triggers matching instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-colors space-y-4">
            <div className="p-3 bg-emerald-500/15 text-emerald-500 rounded-xl max-w-max">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Live Photo Sync & FTP Watch</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              Sync camera directories directly via secure FTPS. Background workers index new uploads on the fly, triggering immediate matching notifications.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors space-y-4">
            <div className="p-3 bg-amber-500/15 text-amber-500 rounded-xl max-w-max">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Private Guest Galleries</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              Row-Level Security isolates photo discovery. Guests only ever view their own matches side-by-side, never other strangers.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/40 border border-[#e8e3d9] dark:border-slate-800 hover:border-brand-500/40 transition-colors space-y-4">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-500 rounded-lg max-w-max">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Fast Downloads & Watermarks</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
              Regulate customized branding. Overlay high-precision watermarks, control high-resolution premium single downloads or batch compressions.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-slate-900/40 border border-[#e8e3d9] dark:border-slate-800 hover:border-brand-500/40 transition-colors space-y-4">
            <div className="p-3 bg-brand-505/10 text-brand-605 dark:text-[#be9f4d] rounded-lg max-w-max">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Detailed Metrics Dashboard</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
              Analyze total event traffic, searches requested, conversion rates index, best shot triggers, and geographic usage vectors.
            </p>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-100/50 dark:bg-slate-950/20 border-y border-[#e8e3d9] dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-light font-display">Simple, Automated Workflow</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
              Transforming file transfers into immediate client joy. Here is the operational loop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            <div className="space-y-4 text-center md:text-left relative">
              <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-[#aa820a] font-bold font-display text-white dark:text-[#0c0c0c] text-lg flex items-center justify-center shadow-lg shadow-brand-600/10">
                01
              </div>
              <h4 className="text-lg font-bold font-display">Create Event</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Enter details, configure custom watermarks and logos, and claim storage limits.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left relative">
              <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-[#aa820a] font-bold font-display text-white dark:text-[#0c0c0c] text-lg flex items-center justify-center shadow-lg shadow-brand-600/10">
                02
              </div>
              <h4 className="text-lg font-bold font-display">Upload Photos</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Drag-and-drop folders, upload camera rolls, or configure high-performance automatic FTPS directories.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left relative">
              <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-[#aa820a] font-bold font-display text-white dark:text-[#0c0c0c] text-lg flex items-center justify-center shadow-lg shadow-brand-600/10">
                03
              </div>
              <h4 className="text-lg font-bold font-display">Share QR Banner</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Generate and print premium QR materials, placards or cards. Place them around tables or ticket exits.
              </p>
            </div>

            <div className="space-y-4 text-center md:text-left relative">
              <div className="w-12 h-12 rounded-lg bg-slate-900 dark:bg-[#aa820a] font-bold font-display text-white dark:text-[#0c0c0c] text-lg flex items-center justify-center shadow-lg shadow-brand-600/10">
                04
              </div>
              <h4 className="text-lg font-bold font-display">Guests Discover</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Guests scan, upload a live selfie, and download their matching curated gallery in less than 3 seconds!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Demo Sandbox Playground */}
      <section id="demo" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex bg-brand-500/10 text-brand-650 dark:text-[#be9f4d] text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-brand-500/20">
            Interactive AI Search Playground
          </div>
          <h2 className="text-3xl font-light font-display">Test Guest Face Search Demo</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-sans">
            Choose a mock event below to unlock the simulated portal, or select the prompt cards to see immediate vector response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => onExploreDemoEvent('evt_sunset_fest')}
            className="cursor-pointer group relative p-6 rounded-xl bg-[#faf7f2] dark:bg-[#0c0c0c]/60 border border-[#e8e3d9] dark:border-slate-800 hover:border-[#aa820a] transition-all flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="text-[9px] bg-slate-905 dark:bg-[#aa820a] text-white dark:text-[#0c0c0c] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">MOCK EVENT 1</span>
              <h4 className="text-lg font-bold font-display mt-3 flex items-center gap-1 group-hover:text-[#aa820a] transition-colors">
                Sunset Festival 2026
                <ArrowRight className="w-4 h-4" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 lines-clamp-2">Malibu Coast vibe, sunglasses, nighttime performances, laughing guests.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-slate-650 dark:text-slate-300">4 photos loaded</span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-slate-650 dark:text-slate-300">Jaccard AI match</span>
            </div>
          </div>

          <div 
            onClick={() => onExploreDemoEvent('evt_tech_summit')}
            className="cursor-pointer group relative p-6 rounded-xl bg-[#faf7f2] dark:bg-[#0c0c0c]/60 border border-[#e8e3d9] dark:border-slate-800 hover:border-[#aa820a] transition-all flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="text-[9px] bg-slate-905 dark:bg-[#4e7d96] text-white dark:text-[#FAF7F2] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">MOCK EVENT 2</span>
              <h4 className="text-lg font-bold font-display mt-3 flex items-center gap-1 group-hover:text-[#aa820a] transition-colors">
                Tech Synergy Conference
                <ArrowRight className="w-4 h-4" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 lines-clamp-2">Headset mics, professional corporate portraits, glasses, and focused developers.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-slate-650 dark:text-slate-300">2 photos loaded</span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-slate-650 dark:text-slate-300">Biometric crop ready</span>
            </div>
          </div>

          <div 
            onClick={() => onExploreDemoEvent('evt_wedding')}
            className="cursor-pointer group relative p-6 rounded-xl bg-[#faf7f2] dark:bg-[#0c0c0c]/60 border border-[#e8e3d9] dark:border-slate-800 hover:border-[#aa820a] transition-all flex flex-col justify-between min-h-[220px]"
          >
            <div>
              <span className="text-[9px] bg-slate-905 dark:bg-[#2d5a40] text-white dark:text-[#FAF7F2] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">MOCK EVENT 3</span>
              <h4 className="text-lg font-bold font-display mt-3 flex items-center gap-1 group-hover:text-[#aa820a] transition-colors">
                Grace & Arthur Wedding
                <ArrowRight className="w-4 h-4" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 lines-clamp-2">Napa valley summer, white bride veils, handsome suits, rose flowers, bridesmaid party.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-[#2a2928] dark:text-slate-300">2 photos loaded</span>
              <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-xs text-slate-650 dark:text-slate-300">Watermasked overlay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-[#f5f2eb] dark:bg-[#0c0c0c]/40 border-y border-[#e8e3d9] dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-light font-display">Pragmatic Subscription Models</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upgrade instantly to increase secure storage storage or activate dynamic white-label watermarking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-205 dark:border-slate-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-2xs text-[#aa820a] uppercase tracking-widest">Free Sandbox</h4>
                <div className="text-3xl font-light font-display my-2 text-slate-900 dark:text-[#faf7f2]">$0</div>
                <p className="text-xs text-slate-500 min-h-[40px]">Test features, simple events, small family gatherings.</p>
                <hr className="my-4 border-[#e8e3d9] dark:border-slate-800" />
                <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-350">
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 1 Sandbox event active</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 100 Photos maximum</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> Biometric facing scan</li>
                </ul>
              </div>
              <button onClick={() => onLoginClick('photographer')} className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider">
                Begin Free
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-205 dark:border-slate-800/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-2xs text-[#aa820a] uppercase tracking-widest">Starter</h4>
                <div className="text-3xl font-light font-display my-2 text-slate-900 dark:text-[#faf7f2]">$19<span className="text-xs font-normal text-slate-400 font-sans">/mo</span></div>
                <p className="text-xs text-slate-500 min-h-[40px]">Best for independent small planners or local organizers.</p>
                <hr className="my-4 border-[#e8e3d9] dark:border-slate-800" />
                <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-350">
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 10 Active Events</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 10 GB Cloud Storage</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> Custom QR Signages</li>
                </ul>
              </div>
              <button onClick={() => onLoginClick('photographer')} className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-840 dark:bg-slate-850 dark:hover:bg-slate-750 text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider">
                Claim Starter
              </button>
            </div>

            <div className="bg-[#fdfcf9] dark:bg-[#aa820a]/5 p-6 rounded-xl border-2 border-brand-500 shadow-xl flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#aa820a] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">POPULAR</span>
              <div>
                <h4 className="font-bold text-2xs text-brand-600 uppercase tracking-widest">Professional</h4>
                <div className="text-4xl font-light font-display my-2 text-slate-900 dark:text-[#faf7f2]">$49<span className="text-xs font-normal text-slate-400 font-sans">/mo</span></div>
                <p className="text-xs text-slate-500 min-h-[40px]">For busy bridal photographers & agency shooters.</p>
                <hr className="my-4 border-[#e8e3d9] dark:border-brand-600" />
                <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 100 Active Events</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> 500 GB Storage size</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" /> Branding Watermarking</li>
                </ul>
              </div>
              <button onClick={() => onLoginClick('photographer')} className="w-full mt-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white dark:text-[#0c0c0c] rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg">
                Claim Professional
              </button>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-850 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-2xs text-[#be9f4d] uppercase tracking-widest">Enterprise</h4>
                <div className="text-3xl font-light font-display my-2 text-[#faf7f2]">$199<span className="text-xs font-normal text-slate-550 font-sans">/mo</span></div>
                <p className="text-xs text-slate-400 min-h-[40px]">For large music festivals, mass sports marathons, agencies.</p>
                <hr className="my-4 border-slate-800" />
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#be9f4d] shrink-0" /> Unlimited Events spaces</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#be9f4d] shrink-0" /> Custom volume limits</li>
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#be9f4d] shrink-0" /> Custom branding limits</li>
                </ul>
              </div>
              <button onClick={() => onLoginClick('photographer')} className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900 text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider">
                Get Enterprise Custom
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold font-display">Endorsed by Top Photographers</h2>
          <p className="text-xs text-slate-500">Read what professional storytellers across the globe have experienced.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <Quote className="w-8 h-8 text-rose-500/20" />
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &quot;PhotoSeek AI completely changed my wedding delivery. Earlier, family guests kept messaging me asking for group links. Now, they scan a single table card, upload a selfie, and they immediately find their pictures. Client review score is 10/10!&quot;
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-xs block">Clara Dupond</span>
                <span className="text-[10px] text-slate-400">Dupond Art Studio, Paris</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <Quote className="w-8 h-8 text-rose-500/20" />
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &quot;The FTPS sync is magnificent. We did a 500-person regional development marathon. As the runners finished checkpoints, RAW files processed live, and they accessed their run stats and snapshots before leaving. Truly revolutionary.&quot;
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-xs block">Adrian Reynolds</span>
                <span className="text-[10px] text-slate-400">Apex Sports Media Group</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <Quote className="w-8 h-8 text-rose-500/20" />
            <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              &quot;We organized Malibu Sunset Fest as organizers and needed to control branding and watermarks because of sponsor rights. PhotoSeek provided us full custom branding rails, customizable colors, and protected metadata. Worth every single cent!&quot;
            </p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=80" alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="font-bold text-xs block">Lydia Thorne</span>
                <span className="text-[10px] text-slate-400">Events Director, Malibu Gala</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold font-display">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">Clarifying our facial vector mapping logic and subscription policies.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex justify-between items-center p-5 text-left font-semibold text-sm transition-colors hover:text-rose-500"
              >
                <span>{faq.q}</span>
                {faqOpen === i ? <Minus className="w-4 h-4 text-rose-500" /> : <Plus className="w-4 h-4" />}
              </button>
              {faqOpen === i && (
                <div className="p-5 pt-0 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-slate-150 dark:bg-slate-950/20 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-xl mx-auto px-4 space-y-8 text-center">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold font-display">Need Custom Integration?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Have specific questions about local GDPR deletions, custom FTPS ports, or White-Label solutions? Send us a request.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert("Telemetry Message Synced successfully! Support tickets mapped."); }} className="space-y-4 text-left bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider mb-1">Company Contact Email</label>
              <input type="email" placeholder="you@company.com" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono" />
            </div>
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider mb-1">Message inquiry</label>
              <textarea placeholder="Tell us about your next festival or camera network setup..." rows={3} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono" />
            </div>
            <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/10 transition-all flex items-center justify-center gap-1">
              <Mail className="w-4 h-4" />
              Dispatch Query
            </button>
          </form>
        </div>
      </section>

      {/* Elegant minimalist Footer */}
      <footer className="bg-[#0c0c0c] text-slate-400 text-xs py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#aa820a] rounded-lg flex items-center justify-center text-[#faf7f2] font-bold font-display italic text-lg shadow-md">P</div>
              <span className="font-extrabold font-display text-[#faf7f2] text-lg italic tracking-tight">PhotoSeek AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Sophisticated guest experience platforms built to elevate wedding, festival, and corporate event narratives. Instant facial recognition galleries matching in under three seconds.
            </p>
          </div>

          <div>
            <span className="font-bold text-white uppercase text-2xs tracking-widest block mb-4">Product</span>
            <ul className="space-y-2 text-slate-400 font-sans">
              <li className="hover:text-brand-500 transition-colors cursor-pointer"><a href="#features">Platform Features</a></li>
              <li className="hover:text-brand-500 transition-colors cursor-pointer"><a href="#how-it-works">How It Works</a></li>
              <li className="hover:text-brand-500 transition-colors cursor-pointer"><a href="#demo">Interactive Demo</a></li>
              <li className="hover:text-brand-500 transition-colors cursor-pointer"><a href="#pricing">Studio Models</a></li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white uppercase text-2xs tracking-widest block mb-4">Trust & Privacy</span>
            <ul className="space-y-2 text-slate-400 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors">Biometric Data Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">GDPR & CCPA Compliance</li>
              <li className="hover:text-white cursor-pointer transition-colors">Advanced Security Protocol</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white uppercase text-2xs tracking-widest block mb-4">Enterprise Care</span>
            <ul className="space-y-2 text-slate-400 font-sans">
              <li className="hover:text-white cursor-pointer transition-colors">Professional White-Labeling</li>
              <li className="hover:text-white cursor-pointer transition-colors">Unlimited Storage Ingress</li>
              <li className="hover:text-white cursor-pointer transition-colors">Priority API Access</li>
              <li className="hover:text-white cursor-pointer transition-colors">Direct Studio Concierge</li>
            </ul>
          </div>

        </div>

        <hr className="my-10 border-slate-900 max-w-7xl mx-auto px-4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-slate-600 text-2xs gap-3">
          <span>© 2026 PhotoSeek AI Corporation. All Rights Reserved. Delivered with high-end craftsmanship.</span>
          <span className="text-slate-700 tracking-wider">PRESTIGE SUITE EXPORT</span>
        </div>
      </footer>

    </div>
  );
}
