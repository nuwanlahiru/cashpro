import React, { useState } from 'react';
import { useSettings, defaultSettings } from '../hooks/useSettings';
import { ArrowLeft, Save, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Task } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

export default function SettingsView({ onBack, tasks, setTasks }: SettingsViewProps) {
  const { settings, setSettings } = useSettings();
  const [currency, setCurrency] = useState(settings.currencyCode || 'LKR');
  const [adminPwd, setAdminPwd] = useState(settings.adminPassword || '2745');
  const [syncUrl, setSyncUrl] = useState(settings.syncUrl || '');
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings({
      ...settings,
      currencyCode: currency,
      adminPassword: adminPwd,
      syncUrl: syncUrl
    });
    
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

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
        <form onSubmit={handleSave} className="space-y-6">
          
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
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())} 
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
                  onChange={(e) => setAdminPwd(e.target.value)} 
                />
                <p className="text-xs text-slate-400 mt-2 ml-1">Used to unlock completed tasks in reports.</p>
              </div>
            </div>
            
            <div className="mt-4">
              <label htmlFor="syncUrl" className="block text-sm font-semibold text-slate-500 mb-1.5 ml-1">Google Apps Script Web App URL (Sync)</label>
              <input 
                id="syncUrl" 
                type="url" 
                className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all font-semibold" 
                value={syncUrl} 
                onChange={(e) => setSyncUrl(e.target.value)} 
                placeholder="https://script.google.com/macros/s/.../exec" 
              />
              <p className="text-xs text-slate-400 mt-2 ml-1">Paste the Web App URL from your Google Apps Script deployment to enable syncing.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {showSavedMsg ? (
              <div className="text-emerald-600 font-medium flex items-center gap-2">
                <CheckCircle size={20} /> Settings Saved
              </div>
            ) : <div/>}

            <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-[16px] hover:bg-indigo-700 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-[24px] border border-red-100 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" /> Danger Zone
        </h3>
        <p className="text-sm text-red-700 mb-5">
          This section contains irreversible actions. Please be certain before proceeding.
        </p>
        
        {showClearConfirm ? (
          <div className="bg-white p-5 rounded-[16px] shadow-sm animate-in fade-in zoom-in-95">
            <p className="text-slate-900 font-semibold mb-4 text-[15px]">Are you completely sure you want to delete ALL application data?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-[12px] hover:bg-slate-200 active:bg-slate-300 transition-colors">
                Cancel
              </button>
              <button onClick={clearAllData} className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-[12px] hover:bg-red-700 active:bg-red-800 transition-colors">
                Yes, Delete Everything
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-red-600 font-semibold rounded-[16px] hover:bg-red-50 active:bg-red-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            <Trash2 size={18} /> Clear All Data
          </button>
        )}
      </div>

    </div>
  );
}
