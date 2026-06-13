'use client';

// Centralized semantic status color presets
export const STATUS_COLORS: Record<string, string> = {
  // positive / completed
  open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  qc_passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sale_confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',

  // in-progress / neutral-active
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  interest_received: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  admin_notified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  qc_scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pickup_scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  in_transit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',

  // negative / terminal-bad
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  qc_failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  // muted / inactive
  draft: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  closed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  expired: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  withdrawn: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

// Centralized category badges mapping
export const CATEGORY_COLORS: Record<string, string> = {
  grain: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700',
  vegetable: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900/30',
  fruit: 'bg-orange-50 text-orange-850 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30',
  spice: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900/30',
  oilseed: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30',
  pulse: 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
  other: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-transparent',
};

export function getCategoryClass(cat: string): string {
  return CATEGORY_COLORS[cat?.toLowerCase()] ?? CATEGORY_COLORS.other;
}

// Centralized interest details states (for buyer/marketplace/[id]/page.tsx)
export const INTEREST_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; labelKey: string }> = {
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    text: 'text-amber-800 dark:text-amber-400',
    labelKey: 'statusPending',
  },
  accepted: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800/50',
    text: 'text-green-800 dark:text-green-400',
    labelKey: 'statusAccepted',
  },
  rejected: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800/50',
    text: 'text-red-700 dark:text-red-400',
    labelKey: 'statusRejected',
  },
  withdrawn: {
    bg: 'bg-stone-50 dark:bg-stone-900',
    border: 'border-stone-200 dark:border-stone-700',
    text: 'text-stone-600 dark:text-stone-400',
    labelKey: 'statusWithdrawn',
  },
};

// StatCard color options
export const STAT_CARD_COLORS = {
  stone: {
    container: 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900',
    icon: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    text: 'text-stone-800 dark:text-stone-100',
  },
  amber: {
    container: 'border-amber-200 dark:border-amber-900/30 bg-white dark:bg-stone-900',
    icon: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-500',
  },
  green: {
    container: 'border-green-200 dark:border-green-900/30 bg-white dark:bg-stone-900',
    icon: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    text: 'text-green-850 dark:text-green-500',
  },
  blue: {
    container: 'border-blue-200 dark:border-blue-900/30 bg-white dark:bg-stone-900',
    icon: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-500',
  },
  red: {
    container: 'border-red-200 dark:border-red-900/30 bg-white dark:bg-stone-900 ring-2 ring-red-500/10',
    icon: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
};
