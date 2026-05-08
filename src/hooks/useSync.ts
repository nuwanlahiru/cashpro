import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSettings } from './useSettings';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export function useSync(tasks: Task[], setTasks: (tasks: Task[]) => void) {
  const { settings } = useSettings();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const initialSyncRef = useRef(false);

  const lastSyncedHash = useRef(JSON.stringify(tasks));

  const pushData = useCallback(async () => {
    if (!settings.syncUrl) return;
    if (!navigator.onLine) {
      setSyncStatus('pending');
      return;
    }

    setSyncStatus('syncing');
    try {
      const response = await fetch(settings.syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'push',
          data: tasks
        })
      });

      const resText = await response.text();
      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (e) {
        throw new Error('Invalid JSON from server');
      }

      if (resData.status === 'success') {
        setSyncStatus('synced');
        lastSyncedHash.current = JSON.stringify(tasks);
        setLastSyncTime(new Date());
      } else {
        throw new Error(resData.message || 'Error syncing');
      }
    } catch (e) {
      console.error('Push error:', e);
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        console.error('This may be a CORS issue. Make sure your Google Apps Script is deployed as a Web App to "Anyone" (not just yourself).');
      }
      setSyncStatus('error');
    }
  }, [settings.syncUrl, tasks]);

  const pullData = useCallback(async () => {
    if (!settings.syncUrl || !navigator.onLine) return;
    if (syncStatus === 'pending') {
      console.warn('Cannot pull data because there are pending offline changes.');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      const response = await fetch(settings.syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'pull'
        })
      });

      const resText = await response.text();
      let resData;
      try {
        resData = JSON.parse(resText);
      } catch (e) {
        throw new Error('Invalid JSON from server');
      }

      if (resData.status === 'success' && resData.data && Array.isArray(resData.data)) {
        lastSyncedHash.current = JSON.stringify(resData.data);
        setTasks(resData.data);
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } else {
        throw new Error(resData.message || 'Error pulling');
      }
    } catch (e) {
      console.error('Pull error:', e);
      if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
        console.error('This may be a CORS issue. Make sure your Google Apps Script is deployed as a Web App to "Anyone" (not just yourself).');
      }
      setSyncStatus('error');
    }
  }, [settings.syncUrl, setTasks, syncStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (settings.syncUrl && syncStatus === 'pending') {
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
  }, [settings.syncUrl, syncStatus, pushData]);

  // Initial Auto-Sync on App Load
  useEffect(() => {
    if (settings.syncUrl && isOnline && !initialSyncRef.current) {
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
  }, [settings.syncUrl, isOnline, tasks.length]); // pullData and pushData deps omitted to prevent loops, we just want it to run once

  // When tasks change and not currently syncing, mark as pending
  useEffect(() => {
    const currentHash = JSON.stringify(tasks);
    if (syncStatus === 'synced' && currentHash !== lastSyncedHash.current) {
      setSyncStatus('pending');
    }
  }, [tasks, syncStatus]);

  // Trigger immediate push when pending
  useEffect(() => {
    if (syncStatus === 'pending' && settings.syncUrl && isOnline) {
      const timer = setTimeout(() => {
        pushData();
      }, 500); // Small debounce
      return () => clearTimeout(timer);
    }
  }, [syncStatus, settings.syncUrl, isOnline, pushData]);

  // Auto-sync retry for failures and periodic pull
  useEffect(() => {
    if (!settings.syncUrl || !isOnline) return;

    const interval = setInterval(() => {
      if (syncStatus === 'pending' || syncStatus === 'error') {
        pushData();
      } else if (syncStatus === 'synced') {
        pullData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.syncUrl, isOnline, syncStatus, pushData, pullData]);

  // Pull data when the app gets focus again
  useEffect(() => {
    const handleFocus = () => {
      if (settings.syncUrl && navigator.onLine && syncStatus === 'synced') {
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
  }, [settings.syncUrl, syncStatus, pullData]);

  return {
    syncStatus,
    isOnline,
    lastSyncTime,
    pushData,
    pullData
  };
}
