import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSettings } from './useSettings';
import { addLog } from '../lib/logger';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

const SYNC_URL = 'https://script.google.com/macros/s/AKfycbw5G_WbPUfcjWST5u9_94QKeq40WpSpFsSEdwoaEnfeyRRr0RPOJA2Hv2rNp_0XYic/exec';

export function useSync(tasks: Task[], setTasks: (tasks: Task[]) => void) {
  const { settings } = useSettings();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const initialSyncRef = useRef(false);

  const lastSyncedHash = useRef(JSON.stringify(tasks));

  const pushData = useCallback(async () => {
    if (!SYNC_URL) return;
    if (!navigator.onLine) {
      addLog('warn', 'Offline: Cannot push data', 'You are currently offline. Changes are pending via auto-sync.');
      setSyncStatus('pending');
      return;
    }

    setSyncStatus('syncing');
    addLog('info', 'Pushing data to server...', { taskCount: tasks.length });

    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'push',
          data: tasks
        }),
        redirect: 'follow'
      });

      const resText = await response.text();
      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (e) {
        addLog('error', 'Push failed: Invalid server response (JSON parse error)', { text: resText });
        throw new Error('Invalid JSON from server');
      }

      if (resData.status === 'success') {
        addLog('success', 'Push successful', { tasksSynced: tasks.length });
        setSyncStatus('synced');
        lastSyncedHash.current = JSON.stringify(tasks);
        setLastSyncTime(new Date());
      } else {
        addLog('error', 'Push failed from server response', { message: resData.message });
        throw new Error(resData.message || 'Error syncing');
      }
    } catch (e) {
      addLog('error', 'Push connection error', e);
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        addLog('warn', 'CORS Issue Detected', 'Make sure your Google Apps Script is deployed as a Web App to "Anyone" (not just yourself).');
      }
      setSyncStatus('error');
    }
  }, [tasks]);

  const pullData = useCallback(async () => {
    if (!SYNC_URL || !navigator.onLine) {
      if (!navigator.onLine) addLog('warn', 'Offline: Cannot pull data');
      return;
    }
    if (syncStatus === 'pending') {
      addLog('warn', 'Cannot pull data now', 'You have local pending offline changes that must be pushed first to avoid overwriting.');
      return;
    }
    
    setSyncStatus('syncing');
    addLog('info', 'Pulling data from server...');

    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'pull'
        }),
        redirect: 'follow'
      });

      const resText = await response.text();
      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (e) {
        addLog('error', 'Pull failed: Invalid server response (JSON parse error)', { text: resText });
        throw new Error('Invalid JSON from server');
      }

      if (resData.status === 'success' && resData.data && Array.isArray(resData.data)) {
        addLog('success', 'Pull successful', { receivedCount: resData.data.length });
        lastSyncedHash.current = JSON.stringify(resData.data);
        setTasks(resData.data);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        addLog('error', 'Pull failed from server response', { message: resData.message });
        throw new Error(resData.message || 'Error pulling');
      }
    } catch (e) {
      addLog('error', 'Pull connection error', e);
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        addLog('warn', 'CORS Issue Detected', 'Make sure your Google Apps Script is deployed as a Web App to "Anyone" (not just yourself).');
      }
      setSyncStatus('error');
    }
  }, [setTasks, syncStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (SYNC_URL && syncStatus === 'pending') {
        pushData();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus, pushData]);

  // Initial Auto-Sync on App Load
  useEffect(() => {
    if (SYNC_URL && isOnline && !initialSyncRef.current) {
      initialSyncRef.current = true;
      setSyncStatus('syncing');
      
      // Give a tiny delay to let UI render before fetching
      setTimeout(() => {
        if (tasks.length === 0) {
          pullData();
        } else {
          pushData();
        }
      }, 500);
    }
  }, [isOnline, tasks.length]); // pullData and pushData deps omitted to prevent loops, we just want it to run once

  // When tasks change and not currently syncing, mark as pending
  useEffect(() => {
    const currentHash = JSON.stringify(tasks);
    if (syncStatus === 'synced' && currentHash !== lastSyncedHash.current) {
      setSyncStatus('pending');
    }
  }, [tasks, syncStatus]);

  // Trigger immediate push when pending
  useEffect(() => {
    if (syncStatus === 'pending' && SYNC_URL && isOnline) {
      const timer = setTimeout(() => {
        pushData();
      }, 500); // Small debounce
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isOnline, pushData]);

  // Auto-sync retry for failures and periodic pull
  useEffect(() => {
    if (!SYNC_URL || !isOnline) return;

    const interval = setInterval(() => {
      if (syncStatus === 'pending' || syncStatus === 'error') {
        pushData();
      } else if (syncStatus === 'synced') {
        pullData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, syncStatus, pushData, pullData]);

  // Pull data when the app gets focus again
  useEffect(() => {
    const handleFocus = () => {
      if (SYNC_URL && navigator.onLine && syncStatus === 'synced') {
        pullData();
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncStatus, pullData]);

  return {
    syncStatus,
    isOnline,
    lastSyncTime,
    pushData,
    pullData
  };
}
