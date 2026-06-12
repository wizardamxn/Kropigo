'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, ListingStatus, InterestStatus } from '@kropi/schemas/enum';

export type AnyStatus = OrderStatus | ListingStatus | InterestStatus;

// Semantic color per status, layered over the Badge base (last class wins via tailwind-merge).
const STATUS_COLORS: Record<string, string> = {
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

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

/**
 * Renders a localized, semantically-colored badge for any order/listing/interest
 * status. Labels come from the shared `status` i18n namespace, keyed by the raw
 * enum value, so they stay in sync with @kropi/schemas.
 */
export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const t = useTranslations('status');
  const color = STATUS_COLORS[status] ?? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';

  return <Badge className={cn('border-transparent', color, className)}>{t(status)}</Badge>;
};
