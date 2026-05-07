import { useState, useCallback, useEffect, useRef } from 'react';
import { Task } from '../types';
import { useSettings } from './useSettings';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export function useSync(tasks: Task[], setTasks: (tasks: Task[]) => void) {
  const { settings } = useSettings();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const initialSyncRef = useRef(false);

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
  }, [settings.syncUrl, syncStatus]);

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
    if (syncStatus === 'synced' && tasks.length > 0) {
      setSyncStatus('pending');
    }
  }, [tasks]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    if (!settings.syncUrl || !isOnline) return;

    const interval = setInterval(() => {
      if (syncStatus === 'pending') {
        pushData();
      } else if (syncStatus === 'synced') {
        pullData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.syncUrl, isOnline, syncStatus, pushData, pullData]);

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
      } else {
        throw new Error(resData.message || 'Error syncing');
      }
    } catch (e) {
      console.error('Push error', e);
      setSyncStatus('error');
    }
  }, [settings.syncUrl, tasks]);

  const pullData = useCallback(async () => {
    if (!settings.syncUrl || !navigator.onLine) return;
    
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
        setTasks(resData.data);
        setSyncStatus('synced');
      } else {
        throw new Error(resData.message || 'Error pulling');
      }
    } catch (e) {
      console.error('Pull error', e);
      setSyncStatus('error');
    }
  }, [settings.syncUrl, setTasks]);

  return {
    syncStatus,
    isOnline,
    pushData,
    pullData
  };
}
