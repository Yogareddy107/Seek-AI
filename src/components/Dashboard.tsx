/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Eye, Trash2, Edit2, Archive, 
  Sparkles, Layers, Shield, RefreshCw, HardDrive, Users, 
  DollarSign, FileText, ChevronRight, X, AlertCircle, Sparkle 
} from 'lucide-react';
import { User, Event, SubscriptionPlan, EventStatus } from '../types';
import EventDetail from './EventDetail';
import FaceAnalysis from './FaceAnalysis';

interface DashboardProps {
  currentUser: User;
  onUpgradeClick: () => void;
  onEventSelectForGuest: (e: Event) => void;
  onLogout: () => void;
}

export default function Dashboard({ currentUser, onUpgradeClick, onEventSelectForGuest, onLogout }: DashboardProps) {
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [downloadsLimit, setDownloadsLimit] = useState(500);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      setEventsList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentUser.id]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          location: eventLocation,
          description: eventDesc,
          downloadsLimit
        })
      });

      const data = await res.json();
      if (res.status !== 200) {
        alert(data.error || 'Failed to create event');
      } else {
        setEventsList(prev => [...prev, data]);
        setIsCreating(false);
        // Clear forms
        setEventName('');
        setEventDate('');
        setEventLocation('');
        setEventDesc('');
      }
    } catch (err) {
      console.error(err);
      alert('Event creation error.');
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you absolutely sure you want to delete this event and pull all associated photos from Cloudflare R2 servers? This action is irreversible.')) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      if (res.ok) {
        setEventsList(prev => prev.filter(ev => ev.id !== id));
        if (activeEvent?.id === id) {
          setActiveEvent(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchiveEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/events/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setEventsList(prev => prev.map(ev => ev.id === id ? updated : ev));
        if (activeEvent?.id === id) {
          setActiveEvent(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      if (res.ok) {
        const duplicated = await res.json();
        setEventsList(prev => [...prev, duplicated]);
        alert(`Event duplicated successfully into a Draft copy!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEventUpdateFromChild = (updated: Event) => {
    setEventsList(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
    setActiveEvent(updated);
  };

  const totalPhotosSum = eventsList.reduce((sum, e) => sum + e.totalPhotos, 0);
  const totalGuestsSum = eventsList.reduce((sum, e) => sum + e.totalGuests, 0);
  const quotaUsedPct = Math.min(100, (currentUser.storageUsed / currentUser.storageLimit) * 100);

  // If detailed project tabs are visible
  if (activeEvent) {
    return (
      <EventDetail 
        event={activeEvent}
        currentUser={currentUser}
        onBack={() => setActiveEvent(null)}
        onEventUpdated={handleEventUpdateFromChild}
      />
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Event count</span>
            <span className="text-xl font-bold block mt-0.5">{eventsList.length} Active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Guest registrations</span>
            <span className="text-xl font-bold block mt-0.5">{totalGuestsSum} Guests</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Photo R2 buffer</span>
            <span className="text-xl font-bold block mt-0.5">{totalPhotosSum} clicks</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest block">Cumulative billing</span>
            <span className="text-xl font-bold block text-emerald-600 mt-0.5">$1,450.00</span>
          </div>
        </div>

      </div>

      {/* Subscription Limit Warning panel if Free tier */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-rose-500 uppercase">
              🔐 Current Tier: {currentUser.subscriptionPlan.toUpperCase()}
            </span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[10px] text-slate-400 font-mono">Quota limits trace: active</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2 max-w-md">
            <div 
              className={`h-full rounded-full ${quotaUsedPct > 80 ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}
              style={{ width: `${quotaUsedPct}%` }}
            />
          </div>
          <span className="text-2xs text-slate-500 block font-mono">
            Using {currentUser.storageUsed} MB of your {currentUser.storageLimit} MB Cloudflare allocation
          </span>
        </div>
        <button
          onClick={onUpgradeClick}
          className="px-4.5 py-2.5 bg-slate-950 dark:bg-rose-600 hover:opacity-90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          Increase limits & quotas
        </button>
      </div>

      {eventsList.length > 0 && (
        <FaceAnalysis events={eventsList} currentUser={currentUser} />
      )}

      {/* Event list manager toolbar */}
      <div className="space-y-4">
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-display">Active Photography Portfolios</h3>
            <p className="text-2xs text-slate-405 mt-0.5 uppercase tracking-wider font-semibold">Select an event below to manage pictures, guests, or QR sign sheets</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4 border border-white rounded-full bg-white text-rose-600" />
            Create Event
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="text-xs font-mono text-slate-400 uppercase">Synchronizing portfolio ledger...</span>
          </div>
        ) : eventsList.length === 0 ? (
          /* Empty dataset */
          <div className="text-center py-16 bg-white dark:bg-slate-900/10 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 rounded-full">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-sm">No Active Events yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Get started today by creating your first event portfolio. Download printable QR signage plates instantly!
              </p>
            </div>
          </div>
        ) : (
          /* Event Grid of photoseek */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventsList.map((evt) => {
              const borderColors = {
                active: 'border-slate-200 hover:border-rose-500/40 dark:border-slate-800',
                archived: 'border-slate-200 dark:border-slate-850 opacity-60',
                draft: 'border-dashed border-rose-500/40'
              };

              return (
                <div
                  key={evt.id}
                  onClick={() => setActiveEvent(evt)}
                  className={`cursor-pointer bg-white dark:bg-slate-900/60 p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px] ${borderColors[evt.status] || borderColors.active}`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        evt.status === 'active' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' 
                          : evt.status === 'archived'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-450'
                            : 'bg-rose-50 text-rose-500'
                      }`}>
                        {evt.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateEvent(evt.id, e)}
                          title="Duplicate Event"
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-400 hover:text-slate-600 rounded text-2xs"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-400 hover:text-slate-600 rounded text-2xs"
                          onClick={(e) => handleArchiveEvent(evt.id, e)}
                        >
                          {evt.status === 'archived' ? 'Reactivate' : 'Archive'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteEvent(evt.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold font-display leading-tight">{evt.name}</h4>
                      <p className="text-[10px] text-slate-450 mt-1 uppercase tracking-wider font-mono flex items-center gap-1 text-slate-500">
                        📍 {evt.location || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs text-slate-550 dark:text-slate-400 font-mono">
                    <div className="flex gap-2">
                      <span>📸 {evt.totalPhotos} Photos</span>
                      <span>👥 {evt.totalGuests} Guests</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* CREATE EVENT DIALOG WIZARD MODAL */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold font-display">Create Event Portfolio</h3>
                <p className="text-3xs text-slate-400 mt-0.5">Provision immediate space mappings inside local PhotoSeek tables.</p>
              </div>
              <button 
                onClick={() => setIsCreating(false)}
                className="p-1.5 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Portfolio Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Grace & Arthur Wedding 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Event Date</label>
                  <input 
                    type="date" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Venue Location</label>
                  <input 
                    type="text" 
                    placeholder="Napa Valley, CA"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description (Optional)</label>
                <textarea 
                  placeholder="Share a sweet summary with guests..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-850 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Provision Portfolio
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
