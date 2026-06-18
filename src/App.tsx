/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, Lock, Mail, User as UserIcon, RefreshCw, Key, 
  ArrowRight, Sparkles, X, Sun, Moon, LogOut, ShieldAlert, CheckCircle 
} from 'lucide-react';

import { User, Event, SubscriptionPlan, Invoice } from './types';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import GuestGallery from './components/GuestGallery';
import PricingModal from './components/PricingModal';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Authenticated Session states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation Routing states
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'guest_explore'>('landing');
  const [selectedGuestEvent, setSelectedGuestEvent] = useState<Event | null>(null);

  // Auth Dialog States
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [authRole, setAuthRole] = useState<'photographer' | 'guest' | 'super_admin'>('photographer');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing Modal state
  const [pricingOpen, setPricingOpen] = useState(false);

  // Guest lookup state (for the enter event code modal/action)
  const [guestCode, setGuestCode] = useState('');

  // Sync Global HTML class with Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check for URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventParam = params.get('event') || params.get('code');
    if (eventParam) {
      const loadEventObj = async () => {
        try {
          const lookupKey = eventParam.toLowerCase().trim();
          let targetId = eventParam; // default direct ID lookup
          if (lookupKey === 'sunset') targetId = 'evt_sunset_fest';
          if (lookupKey === 'summit') targetId = 'evt_tech_summit';
          if (lookupKey === 'wedding') targetId = 'evt_wedding';

          const res = await fetch(`/api/events/${targetId}`);
          if (res.ok) {
            const eventData = await res.json();
            setSelectedGuestEvent(eventData);
            setCurrentView('guest_explore');
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadEventObj();
    }
  }, []);

  // Handle user login submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      if (authTab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role: authRole })
        });
        const data = await res.json();
        if (res.status !== 200) {
          setAuthError(data.error || 'Invalid credentials');
        } else {
          setCurrentUser(data.user);
          setAuthOpen(false);
          // Redirect appropriately
          if (data.user.role === 'super_admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
        }
      } else if (authTab === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role: authRole })
        });
        const data = await res.json();
        if (res.status !== 200) {
          setAuthError(data.error || 'Registration failed');
        } else {
          setAuthSuccess('Account registered! Please click login now.');
          setAuthTab('login');
        }
      } else if (authTab === 'forgot') {
        // Recovery trigger
        const res = await fetch('/api/auth/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setAuthSuccess(data.message || 'Recovery email simulated to your inbox!');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Authentication pipeline error. Connection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setSelectedGuestEvent(null);
  };

  const handleOpenAuth = (role?: 'photographer' | 'guest') => {
    if (role === 'guest') {
      setAuthRole('photographer'); // Or ask guest code directly
      // Open inline guest routing directly
      const inputCode = prompt('Enter 6-Character Event Code (e.g., sunset, summit, wedding):');
      if (inputCode) {
        handleGuestCodeSubmit(inputCode);
      }
    } else {
      setAuthRole('photographer');
      setAuthTab('login');
      setAuthOpen(true);
    }
  };

  const handleGuestCodeSubmit = async (code: string) => {
    if (!code) return;
    try {
      // Find event by standard matching key
      const lookupKey = code.toLowerCase().trim();
      let targetId = 'evt_sunset_fest'; // default fallback
      if (lookupKey.includes('summit')) targetId = 'evt_tech_summit';
      if (lookupKey.includes('wedding')) targetId = 'evt_wedding';
      
      const res = await fetch(`/api/events/${targetId}`);
      if (res.ok) {
        const eventData = await res.json();
        setSelectedGuestEvent(eventData);
        setCurrentView('guest_explore');
      } else {
        alert('Invalid Event code pattern. Please use "sunset", "summit", or "wedding".');
      }
    } catch (e) {
      console.error(e);
      alert('Event lookup failed.');
    }
  };

  // Callback helper for plan upgrades success
  const handleUpgradeSuccess = (newPlan: SubscriptionPlan, invoice: Invoice) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        subscriptionPlan: newPlan,
        storageLimit: newPlan === 'starter' ? 10 * 1024 : newPlan === 'professional' ? 500 * 1024 : 1000 * 1024
      };
      setCurrentUser(updatedUser);
      // Trigger notification
      alert(`Account Upgrade Settled! Reciept ${invoice.invoiceNumber} disbursed.`);
    }
  };

  const exploreEventFromDemo = async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const eventData = await res.json();
        setSelectedGuestEvent(eventData);
        setCurrentView('guest_explore');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Small floating utility bar for admins/photographers */}
      {currentUser && (
        <div className="bg-slate-900 dark:bg-[#0c1220] border-b border-slate-800 text-white p-2 flex justify-between items-center px-4 sm:px-8 z-50 sticky top-0 md:relative">
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              {currentUser.role.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">Logged in as {currentUser.name} ({currentUser.email})</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {currentUser.role === 'super_admin' && (
              <button 
                onClick={() => setCurrentView('admin')}
                className={`hover:text-rose-400 transition-all ${currentView === 'admin' ? 'text-rose-455' : 'text-slate-300'}`}
              >
                Super Console
              </button>
            )}
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`hover:text-rose-400 transition-all ${currentView === 'dashboard' ? 'text-rose-455' : 'text-slate-300'}`}
            >
              Photographer Dashboard
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Container routes */}
      {currentView === 'landing' ? (
        <LandingPage 
          onLoginClick={handleOpenAuth} 
          onExploreDemoEvent={exploreEventFromDemo}
        />
      ) : currentView === 'guest_explore' && selectedGuestEvent ? (
        <GuestGallery 
          event={selectedGuestEvent} 
          onBackToLanding={() => setCurrentView('landing')} 
        />
      ) : (
        /* Authenticated Control Centers */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          
          <div className="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-800/80 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-display bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
                PhotoSeek AI Panel
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme toggle indicator */}
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-805"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-rose-500" /> : <Moon className="w-4 h-4 text-blue-500" />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>

          {currentView === 'admin' && currentUser?.role === 'super_admin' ? (
            <AdminPanel currentUser={currentUser} />
          ) : (
            currentUser && (
              <Dashboard 
                currentUser={currentUser} 
                onUpgradeClick={() => setPricingOpen(true)}
                onEventSelectForGuest={(evt) => {
                  setSelectedGuestEvent(evt);
                  setCurrentView('guest_explore');
                }}
                onLogout={handleLogout}
              />
            )
          )}
        </main>
      )}

      {/* AUTHENTICATION MODAL */}
      {authOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Header branding */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-center relative">
              <button 
                onClick={() => setAuthOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md mb-3">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display">Welcome to PhotoSeek AI</h3>
              <p className="text-3xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Join wedding & action sports photographers worldwide</p>
            </div>

            {/* Panel Tabs (Login/Register toggle) */}
            <div className="flex border-b border-slate-150 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
              <button 
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${authTab === 'login' ? 'border-rose-500 text-slate-800 dark:text-slate-150' : 'border-transparent hover:text-slate-700'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setAuthTab('register')}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${authTab === 'register' ? 'border-rose-500 text-slate-800 dark:text-slate-150' : 'border-transparent hover:text-slate-700'}`}
              >
                Register
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4">
              
              {authError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-950 text-rose-600 text-2xs font-semibold rounded-xl flex items-center gap-1.5 leading-tight">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/35 text-emerald-600 dark:text-emerald-400 text-2xs font-semibold rounded-xl flex items-center gap-1.5 leading-tight">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {authSuccess}
                </div>
              )}

              {/* Developer credentials lookup panel */}
              {authTab === 'login' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl space-y-1.5 text-2xs border border-slate-150 dark:border-slate-850">
                  <div className="flex justify-between font-bold uppercase tracking-wider text-slate-400">
                    <span>Sandbox Fast Credentials</span>
                    <span className="text-rose-500 font-mono text-[9px]">Autofill</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmail('superadmin@photoseek.ai');
                        setPassword('superpass123');
                        setAuthRole('super_admin');
                      }}
                      className="bg-white dark:bg-slate-850 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-202 text-slate-610 dark:text-slate-310"
                    >
                      Admin
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setEmail('photographer@canon.com');
                        setPassword('canvas123');
                        setAuthRole('photographer');
                      }}
                      className="bg-white dark:bg-slate-850 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-202 text-slate-610 dark:text-slate-310"
                    >
                      Photographer
                    </button>
                  </div>
                </div>
              )}

              {authTab === 'register' && (
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Your Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. Tiffany Alvarez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-rose-500"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {authTab !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500">Security Password</label>
                    {authTab === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => setAuthTab('forgot')}
                        className="text-3xs font-semibold text-slate-450 hover:text-rose-500 uppercase tracking-wilder"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-950 dark:bg-rose-600 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide mt-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authTab === 'login' ? (
                  'Sign In'
                ) : authTab === 'register' ? (
                  'Create Studio Account'
                ) : (
                  'Send Reset Simulated Token'
                )}
              </button>

              {authTab === 'login' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row justify-between text-3xs text-slate-400 dark:text-slate-500 gap-1.5">
                  <span className="flex items-center gap-0.5 font-mono"><Key className="w-3.5 h-3.5 text-emerald-500" /> Biometrics isolation enabled</span>
                  <span>GDPR strict delete compliant</span>
                </div>
              )}

            </form>

          </div>
        </div>
      )}

      {/* PRICING PLANS DIALOG MODAL */}
      {currentUser && (
        <PricingModal 
          isOpen={pricingOpen} 
          onClose={() => setPricingOpen(false)} 
          currentUser={currentUser} 
          onUpgradeSuccess={handleUpgradeSuccess} 
        />
      )}

    </div>
  );
}
