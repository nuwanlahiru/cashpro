/// <reference types="vite/client" />
import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { Task } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  isOnline: boolean;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'error';
  lastSyncTime: Date | null;
}

export default function SettingsView({ onBack, tasks, setTasks, isOnline, syncStatus, lastSyncTime }: SettingsViewProps) {
  const { settings, setSettings } = useSettings();
  const [currency, setCurrency] = useState(settings.currencyCode || 'LKR');
  const [adminPwd, setAdminPwd] = useState(settings.adminPassword || '2745');
  const [syncUrl, setSyncUrl] = useState(settings.syncUrl || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const clearAllData = () => {
    if (confirm("Are you SURE you want to clear ALL data? This action cannot be undone.")) {
      setTasks([]);
      localStorage.removeItem('expense_tasks');
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <button 
          onClick={onBack}
          className="text-[15px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 transition-colors flex items-center gap-1"
          aria-label="Go back to Dashboard"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-900 ml-auto mr-auto pl-10 sm:pl-0 sm:ml-4 sm:mr-0">Settings</h2>
      </div>

      <div className="bg-[var(--th-white)] rounded-[24px] p-6 sm:p-8 shadow-sm border border-[var(--th-slate-200)]">
        <div className="space-y-6">
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Initial Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currencyCode" className="block text-sm font-semibold text-slate-500 mb-1.5 ml-1">Currency Code</label>
                <input 
                  id="currencyCode" 
                  type="text" 
                  required 
                  className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all font-semibold" 
                  value={currency} 
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setCurrency(val);
                    setSettings({ ...settings, currencyCode: val });
                  }} 
                  placeholder="e.g. USD, EUR, LKR" 
                  maxLength={5}
                />
              </div>

              <div>
                <label htmlFor="adminPwd" className="block text-sm font-semibold text-slate-500 mb-1.5 ml-1">Admin Password</label>
                <input 
                  id="adminPwd" 
                  type="password" 
                  required 
                  className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all font-semibold" 
                  value={adminPwd} 
                  onChange={(e) => {
                    setAdminPwd(e.target.value);
                    setSettings({ ...settings, adminPassword: e.target.value });
                  }} 
                />
                <p className="text-xs text-slate-400 mt-2 ml-1">Used to unlock completed tasks in reports.</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label htmlFor="syncUrl" className="block text-sm font-semibold text-[var(--th-slate-500)]">Google Apps Script Web App URL (Sync)</label>
                {syncUrl && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${!isOnline ? 'bg-red-50 text-red-600' : syncStatus === 'error' ? 'bg-orange-50 text-orange-600' : syncStatus === 'syncing' ? 'bg-indigo-50 text-indigo-600' : syncStatus === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {!isOnline ? 'Offline' : syncStatus === 'error' ? 'Error' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'pending' ? 'Pending Changes' : 'Connected & Synced'}
                  </span>
                )}
              </div>
              <input 
                id="syncUrl" 
                type="url" 
                className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-[var(--th-indigo-500)] focus:bg-[var(--th-white)] outline-none transition-all font-semibold" 
                value={syncUrl} 
                onChange={(e) => {
                  setSyncUrl(e.target.value);
                  setSettings({ ...settings, syncUrl: e.target.value });
                }} 
                placeholder="https://script.google.com/macros/s/.../exec" 
              />
              <p className="text-[13px] text-[var(--th-slate-500)] mt-2 ml-1 leading-relaxed">Paste the Web App URL from your Google Apps Script deployment to enable syncing.</p>
              
              {syncUrl && syncStatus === 'error' && (
                <div className="mt-4 p-4 bg-orange-50 rounded-[16px] border border-orange-100 flex items-start gap-3">
                  <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-orange-800 mb-1">Configuration Required</h4>
                    <p className="text-[13px] text-orange-700 leading-relaxed">
                      If you're seeing persistent errors, your deployment may restrict access.
                      Make sure your Google Apps Script is deployed as a Web App with:
                      <br />
                      <strong className="block mt-1.5">• Execute as: Me</strong>
                      <strong className="block">• Who has access: Anyone</strong>
                    </p>
                  </div>
                </div>
              )}

              {lastSyncTime && syncUrl && syncStatus !== 'error' && (
                <p className="text-xs text-[var(--th-slate-500)] mt-2 ml-1 font-medium">Last synced: {lastSyncTime.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-[24px] border border-red-100 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" /> Danger Zone
        </h3>
        <p className="text-sm text-red-700 mb-5">
          This section contains irreversible actions. Please be certain before proceeding.
        </p>
        
        {showClearConfirm ? (
          <div className="bg-[var(--th-white)] p-5 rounded-[16px] shadow-sm animate-in fade-in zoom-in-95 border border-[var(--th-slate-200)]">
            <p className="text-[var(--th-slate-900)] font-semibold mb-4 text-[15px]">Are you completely sure you want to delete ALL application data?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-[var(--th-slate-100)] text-[var(--th-slate-700)] font-semibold rounded-[12px] hover:bg-[var(--th-slate-200)] active:bg-[var(--th-slate-300)] transition-colors">
                Cancel
              </button>
              <button onClick={clearAllData} className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-[12px] hover:bg-red-700 active:bg-red-800 transition-colors">
                Yes, Delete Everything
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-5 py-3 bg-[var(--th-white)] text-red-600 font-semibold rounded-[16px] border border-red-100 hover:bg-red-50 active:bg-red-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 mb-4">
            <Trash2 size={18} /> Clear All Data
          </button>
        )}

        {import.meta.env.DEV && (
            <button 
                onClick={async () => {
                    if ('serviceWorker' in navigator) {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        for (const reg of regs) {
                            await reg.unregister();
                        }
                    }
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        for (const key of keys) {
                            await caches.delete(key);
                        }
                    }
                    alert("Cache and Service Workers cleared. Reloading...");
                    window.location.reload();
                }} 
                className="flex items-center gap-2 px-5 py-3 bg-orange-100 text-orange-700 font-semibold rounded-[16px] hover:bg-orange-200 active:bg-orange-300 transition-colors mt-4"
            >
                Clear Cache (Dev Only)
            </button>
        )}
      </div>

    </div>
  );
}
