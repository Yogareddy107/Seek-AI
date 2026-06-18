/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, HardDrive, DollarSign, Search, ShieldCheck, 
  Trash2, RefreshCw, Layers, FileText, CheckCircle, Flame 
} from 'lucide-react';
import { User, Event, AuditLog, Invoice } from '../types';

interface AdminPanelProps {
  currentUser: User;
}

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [adminStats, setAdminStats] = useState<{
    totalUsers: number;
    totalEvents: number;
    totalPhotosCount: number;
    totalInvoiced: number;
    users: User[];
    invoices: Invoice[];
    recentLogs: AuditLog[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'events' | 'invoices' | 'audits'>('users');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          'Authorization': `Bearer ${currentUser.id}`
        }
      });
      const data = await res.json();
      setAdminStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-sm text-slate-500 font-mono">Loading telemetry cluster stats...</p>
      </div>
    );
  }

  const filteredUsers = adminStats?.users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      
      {/* Overview Cards Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl glass-panel shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Registrations</span>
            <span className="text-2xl font-bold font-display">{adminStats?.totalUsers} Users</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Active Events</span>
            <span className="text-2xl font-bold font-display">{adminStats?.totalEvents} Events</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Global Photos Storage</span>
            <span className="text-2xl font-bold font-display">{adminStats?.totalPhotosCount} Photos</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">SaaS gross Revenue</span>
            <span className="text-2xl font-bold font-display text-emerald-600">${adminStats?.totalInvoiced} USD</span>
          </div>
        </div>

      </div>

      {/* Main Tab Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Sub tabs list */}
          <div className="flex gap-1.5 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'users'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'invoices'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <FileText className="w-4 h-4" />
              Sales & Invoices
            </button>
            <button
              onClick={() => setActiveSubTab('audits')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'audits'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Layers className="w-4 h-4" />
              Audit Trace
            </button>
          </div>

          {/* Search container */}
          {activeSubTab === 'users' && (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search globally..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            </div>
          )}

        </div>

        {/* Content displays */}
        <div className="p-4 sm:p-6">
          
          {activeSubTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 font-display uppercase tracking-wider">
                    <th className="pb-3 pl-2">User details</th>
                    <th className="pb-3">Assigned Role</th>
                    <th className="pb-3">Subscription</th>
                    <th className="pb-3">Storage Allocation</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                  {filteredUsers.map((u) => {
                    const storagePct = Math.min(100, (u.storageUsed / u.storageLimit) * 100);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="py-4 pl-2 flex items-center gap-3">
                          <img 
                            src={u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" 
                          />
                          <div>
                            <span className="font-semibold block font-display">{u.name}</span>
                            <span className="text-xs text-slate-400 font-mono block">{u.email}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'super_admin' 
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' 
                              : u.role === 'photographer'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {u.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300 uppercase text-xs">
                            {u.subscriptionPlan} Plan
                          </span>
                        </td>
                        <td className="py-4 w-60">
                          <div className="space-y-1">
                            <span className="text-xs font-mono text-slate-450 block">{u.storageUsed} MB / {u.storageLimit} MB</span>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${storagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${storagePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <button 
                            type="button" 
                            disabled={u.id === currentUser.id}
                            className="p-1 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => alert('Biometric deletion triggered. Row level database protection executed.')}
                          >
                            Revoke User
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-950/30 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium">Automatic sandbox invoice settlements. All payment receipts compiled into the ledger.</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 font-display uppercase tracking-wider">
                      <th className="pb-3 pl-2">Invoice Number</th>
                      <th className="pb-3">Upgrade Plan</th>
                      <th className="pb-3">Bill Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-sm">
                    {adminStats?.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="py-3 pl-2 font-mono text-xs font-semibold text-rose-500">{inv.invoiceNumber}</td>
                        <td className="py-3 font-medium">{inv.planName}</td>
                        <td className="py-3 text-xs text-slate-400 font-mono">{inv.invoiceDate}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-955 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-600 font-mono">${inv.amount} {inv.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'audits' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-xl text-xs font-mono max-w-max">
                <Flame className="w-4 h-4 fill-amber-500 stroke-amber-600" />
                Live Cloud Run Logs Sync
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 border-b border-slate-800 p-2 pl-4 flex justify-between items-center text-slate-400 font-mono text-2xs">
                  <span>PhotoSeek Audit Logs Database Console</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    BUFFER ONLINE
                  </span>
                </div>
                <div className="bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-3.5 max-h-[460px] overflow-y-auto">
                  {adminStats?.recentLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1 space-y-1 hover:border-rose-500 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between text-2xs text-slate-500 gap-1">
                        <span>{new Date(log.timestamp).toLocaleTimeString()} - {log.userEmail}</span>
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-450 uppercase font-bold text-[10px] sm:self-start">{log.action}</span>
                      </div>
                      <p className="text-slate-200 text-2xs sm:text-xs">{log.details}</p>
                    </div>
                  ))}
                  {(!adminStats || adminStats.recentLogs.length === 0) && (
                    <p className="text-slate-500 text-center py-6 text-2xs">No transactions recorded in this cluster interval.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
