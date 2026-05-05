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
      if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
    } catch (e) {}
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('app_settings_changed'));
  }, [settings]);

  return { settings, setSettings };
}
