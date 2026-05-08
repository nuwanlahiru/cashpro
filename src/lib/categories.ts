import { ReactNode } from 'react';
import { Coffee, Fuel, Bus, Home, Wrench, Tag, ShoppingBag, Plus, Sparkles, type LucideIcon } from 'lucide-react';

export interface CategoryInfo {
  id: string;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'Food', label: 'Food & Meals', icon: Coffee, bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  { id: 'Fuel', label: 'Fuel & Gas', icon: Fuel, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 'Transport', label: 'Travel & Tolls', icon: Bus, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  { id: 'Accommodation', label: 'Hotel & Stay', icon: Home, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  { id: 'Materials', label: 'Materials', icon: Wrench, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  { id: 'Other', label: 'Other', icon: Tag, bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
];

export const GENERAL_CUSTOM_CATEGORY: CategoryInfo = {
  id: 'custom',
  label: 'Custom',
  icon: Sparkles,
  bgColor: 'bg-purple-50',
  textColor: 'text-purple-600'
};

export function getCategoryInfo(categoryId: string): CategoryInfo {
  const found = DEFAULT_CATEGORIES.find(c => c.id === categoryId || c.label === categoryId);
  if (found) return found;
  
  // Custom categories
  return {
    ...GENERAL_CUSTOM_CATEGORY,
    id: categoryId,
    label: categoryId
  };
}
