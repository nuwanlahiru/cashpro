/// <reference types="vite/client" />
import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { Task } from '../types';
import { useModalBack } from '../hooks/useModalBack';

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPwdInput, setClearPwdInput] = useState('');
  const [clearPwdError, setClearPwdError] = useState(false);

  const [isChangingPwd, setIsChangingPwd] = useState(!settings.adminPassword);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdError, setPwdError] = useState(false);

  useModalBack(showClearConfirm, () => {
    setShowClearConfirm(false);
    setClearPwdInput('');
    setClearPwdError(false);
  }, 'clearConfirm');

  const clearAllData = () => {
    if (settings.adminPassword && clearPwdInput !== settings.adminPassword) {
      setClearPwdError(true);
      setTimeout(() => setClearPwdError(false), 2000);
      return;
    }
    
    if (confirm("Are you SURE you want to clear ALL data? This action cannot be undone.")) {
      setTasks([]);
      localStorage.removeItem('expense_tasks');
      setShowClearConfirm(false);
      setClearPwdInput('');
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
                <label className="block text-sm font-semibold text-slate-500 mb-1.5 ml-1">Admin Password</label>
                {!isChangingPwd ? (
                  <button
                    onClick={() => setIsChangingPwd(true)}
                    className="w-full text-left rounded-[16px] bg-[var(--bg-app)] border border-[var(--th-slate-200)] px-4 py-3.5 hover:bg-[var(--th-slate-50)] outline-none transition-all font-semibold flex items-center justify-between group"
                  >
                    <span className="text-[var(--th-slate-700)]">••••••••</span>
                    <span className="text-[13px] text-indigo-600 font-bold group-hover:text-indigo-700">Change</span>
                  </button>
                ) : (
                  <div className="bg-[var(--bg-app)] p-4 rounded-[16px] border border-[var(--th-slate-200)] space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    {settings.adminPassword && (
                      <div>
                        <input 
                          type="password" 
                          placeholder="Current password"
                          className={`w-full rounded-[12px] bg-[var(--th-white)] border px-4 py-2.5 outline-none transition-all font-semibold ${
                            pwdError ? 'border-red-500 text-red-600 focus:border-red-500' : 'border-[var(--th-slate-200)] focus:border-indigo-500'
                          }`}
                          value={pwdCurrent} 
                          onChange={(e) => setPwdCurrent(e.target.value)} 
                        />
                        {pwdError && <p className="text-red-500 text-xs font-semibold mt-1.5 ml-1">Incorrect current password</p>}
                      </div>
                    )}
                    <input 
                      type="password" 
                      placeholder="New password (leave empty to remove)"
                      className="w-full rounded-[12px] bg-[var(--th-white)] border border-[var(--th-slate-200)] px-4 py-2.5 focus:border-indigo-500 outline-none transition-all font-semibold"
                      value={pwdNew} 
                      onChange={(e) => setPwdNew(e.target.value)} 
                    />
                    <div className="flex gap-2 pt-1">
                      {settings.adminPassword && (
                        <button 
                          onClick={() => {
                            setIsChangingPwd(false);
                            setPwdCurrent('');
                            setPwdNew('');
                            setPwdError(false);
                          }}
                          className="flex-1 py-2 bg-[var(--th-slate-200)] text-[var(--th-slate-700)] font-semibold rounded-[10px] hover:bg-[var(--th-slate-300)] transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (settings.adminPassword && pwdCurrent !== settings.adminPassword) {
                            setPwdError(true);
                            setTimeout(() => setPwdError(false), 2000);
                            return;
                          }
                          setSettings({ ...settings, adminPassword: pwdNew });
                          if (pwdNew) {
                            setIsChangingPwd(false);
                          }
                          setPwdCurrent('');
                          setPwdNew('');
                        }}
                        className="flex-1 py-2 bg-indigo-600 text-white font-semibold rounded-[10px] hover:bg-indigo-700 transition-colors text-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[13px] text-slate-500 mt-2 ml-1 leading-relaxed">Used to unlock completed tasks in reports.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-[var(--th-slate-100)] pt-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sync Status</h3>
            <div className="bg-[var(--bg-app)] rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-500">Current Status</span>
                <span className={`text-sm font-semibold flex items-center gap-1.5 ${!isOnline ? 'text-red-600' : syncStatus === 'error' ? 'text-orange-600' : syncStatus === 'syncing' ? 'text-indigo-600 animate-pulse' : syncStatus === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {!isOnline ? 'Offline' : syncStatus === 'error' ? 'Error' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'pending' ? 'Pending Changes' : 'Connected & Synced'}
                </span>
              </div>
              {lastSyncTime && syncStatus !== 'error' && (
                <p className="text-xs text-[var(--th-slate-500)] font-medium">Last synced: {lastSyncTime.toLocaleString()}</p>
              )}
              {syncStatus === 'error' && (
                 <p className="text-xs text-orange-600 font-medium mt-2">Error during synchronization. Check logs for details.</p>
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
            
            {settings.adminPassword && (
              <div className="mb-4">
                <input
                  type="password"
                  value={clearPwdInput}
                  onChange={(e) => setClearPwdInput(e.target.value)}
                  placeholder="Enter admin password"
                  className={`w-full rounded-[12px] bg-[var(--bg-app)] border px-4 py-2.5 outline-none transition-all font-semibold ${
                    clearPwdError ? 'border-red-500 text-red-600 focus:border-red-500' : 'border-[var(--th-slate-200)] focus:border-red-500'
                  }`}
                />
                {clearPwdError && <p className="text-red-500 text-xs font-semibold mt-1.5 ml-1">Incorrect password</p>}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearPwdInput('');
                  setClearPwdError(false);
                }} 
                className="flex-1 py-2.5 bg-[var(--th-slate-100)] text-[var(--th-slate-700)] font-semibold rounded-[12px] hover:bg-[var(--th-slate-200)] active:bg-[var(--th-slate-300)] transition-colors"
              >
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
