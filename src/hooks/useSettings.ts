import { useState, useEffect } from 'react';

export interface AppSettings {
  currencyCode: string;
  adminPassword?: string;
}

export const defaultSettings: AppSettings = {
  currencyCode: 'LKR',
  adminPassword: '2745'
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {}
    return defaultSettings;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('app_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (e) {}
    };

    window.addEventListener('app_settings_changed', handleStorageChange);
    return () => window.removeEventListener('app_settings_changed', handleStorageChange);
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('app_settings_changed'));
  };

  return { settings, setSettings: saveSettings };
}
