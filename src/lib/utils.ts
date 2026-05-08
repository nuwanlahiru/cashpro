import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  let currencyCode = 'LKR';
  try {
    const settingsRaw = localStorage.getItem('app_settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      if (settings.currencyCode) currencyCode = settings.currencyCode;
    }
  } catch(e) {}

  if (currencyCode === 'LKR' || currencyCode === 'RS' || currencyCode === 'RS.') {
    return `Rs. ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount);
  } catch(e) {
    return `${currencyCode} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
