import type { UnitType } from '@/types';

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'GroceryIMS';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const UNITS: { value: UnitType; label: string }[] = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'L', label: 'Liter (L)' },
  { value: 'mL', label: 'Milliliter (mL)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
  { value: 'can', label: 'Can' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'pack', label: 'Pack' },
  { value: 'tray', label: 'Tray' },
  { value: 'bunch', label: 'Bunch' },
];

export const UNIT_LABEL: Record<UnitType, string> = Object.fromEntries(
  UNITS.map(({ value, label }) => [value, label])
) as Record<UnitType, string>;

export const ALERT_SEVERITY_CONFIG = {
  info: { label: 'Info', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  warning: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
} as const;

export const EXPIRY_STATUS_CONFIG = {
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' },
  expiring_soon: { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ok: { label: 'Good', color: 'bg-green-100 text-green-700 border-green-200' },
} as const;

export const SALE_STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  voided: { label: 'Voided', color: 'bg-gray-100 text-gray-700' },
  refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-700' },
} as const;

export const EXPIRY_WARNING_DAYS = 7;
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/inventory', label: 'Inventory', icon: 'Package' },
  { href: '/sales', label: 'Sales', icon: 'ShoppingCart' },
  { href: '/expiry', label: 'Expiry Monitor', icon: 'Clock' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart3' },
  { href: '/users', label: 'Users', icon: 'Users', adminOnly: true },
] as const;

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#a855f7',
];
