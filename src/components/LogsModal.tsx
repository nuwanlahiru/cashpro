import React, { useState, useEffect } from 'react';
import { Trash2, Info, AlertTriangle, XCircle, CheckCircle, Copy, X } from 'lucide-react';
import { LogEntry, subscribeLogs, clearLogs } from '../lib/logger';
import { format } from 'date-fns';

export default function LogsModal({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    return subscribeLogs(setLogs);
  }, []);

  const handleCopyLogs = () => {
    const logText = logs.map(l => `[${format(new Date(l.time), 'HH:mm:ss')}] ${l.level.toUpperCase()}: ${l.message} ${l.details ? '- ' + l.details : ''}`).join('\n');
    navigator.clipboard.writeText(logText);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[var(--th-white)] rounded-[24px] shadow-xl border border-[var(--th-slate-200)] w-full max-w-sm max-h-[60vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[var(--th-slate-100)]">
          <h2 className="text-lg font-bold text-[var(--th-slate-900)]">Sync Logs</h2>
          <div className="flex items-center gap-1">
            {logs.length > 0 && (
              <>
                <button
                  onClick={handleCopyLogs}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  title="Copy logs"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Clear logs"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-[var(--bg-app)]">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Info className="w-8 h-8 text-[var(--th-slate-400)] mx-auto mb-2 opacity-50" />
              <p className="text-[var(--th-slate-500)] text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => {
                let icon = <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />;
                if (log.level === 'warn') icon = <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />;
                if (log.level === 'error') icon = <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />;
                if (log.level === 'success') icon = <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />;

                // compact formatting
                let compactMessage = log.message;
                if (log.message.includes('Pushing')) compactMessage = 'Pushing...';
                if (log.message.includes('Push successful')) {
                   try {
                     const parsed = JSON.parse(log.details || '{}');
                     compactMessage = `Push: ${parsed.tasksSynced || 0} tasks`;
                   } catch(e) { compactMessage = 'Push complete'; }
                }
                if (log.message.includes('Pulling')) compactMessage = 'Pulling...';
                if (log.message.includes('Pull successful')) {
                   try {
                     const parsed = JSON.parse(log.details || '{}');
                     compactMessage = `Pull: ${parsed.receivedCount || 0} tasks`;
                   } catch(e) { compactMessage = 'Pull complete'; }
                }

                return (
                  <div key={log.id} className="bg-[var(--th-white)] p-2.5 rounded-[12px] border border-[var(--th-slate-200)] shadow-sm flex items-start gap-2">
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-[13px] font-medium leading-tight ${log.level === 'error' ? 'text-red-700' : log.level === 'warn' ? 'text-amber-700' : 'text-slate-700'}`}>
                          {compactMessage}
                        </p>
                        <time className="text-[10px] text-slate-400 shrink-0">{format(new Date(log.time), 'HH:mm:ss')}</time>
                      </div>
                      {log.level === 'error' && log.details && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                          {log.details.replace(/^{.*}$/, 'Internal error')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
