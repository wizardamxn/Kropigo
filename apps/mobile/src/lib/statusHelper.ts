import { useTranslations } from 'use-intl';
import type { ListingStatus } from '@/store/marketplaceApi';
import type { OrderStatus } from '@/store/ordersApi';

type AnyStatus = ListingStatus | OrderStatus | 'pending' | 'accepted' | 'rejected' | 'withdrawn';

const GREEN = 'text-primary bg-green-100 dark:text-green-400 dark:bg-green-950';
const AMBER = 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950';
const BLUE = 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950';
const RED = 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950';
const NEUTRAL = 'text-stone-600 bg-stone-200 dark:text-stone-400 dark:bg-stone-800';

/** Badge colours only — labels come from the shared `status` message namespace. */
export const statusBadgeClass: Record<AnyStatus, string> = {
  draft: NEUTRAL,
  open: GREEN,
  interest_received: AMBER,
  sale_confirmed: GREEN,
  cancelled: RED,
  expired: NEUTRAL,
  closed: NEUTRAL,
  admin_notified: AMBER,
  qc_scheduled: AMBER,
  qc_passed: GREEN,
  qc_failed: RED,
  pickup_scheduled: BLUE,
  in_transit: BLUE,
  delivered: GREEN,
  pending: AMBER,
  accepted: GREEN,
  rejected: RED,
  withdrawn: NEUTRAL,
};

/**
 * Reuses the web app's `status` catalogue so a status never drifts between
 * platforms or languages.
 */
export function useStatusMeta() {
  const t = useTranslations('status');
  return (status: AnyStatus) => ({
    label: t(status),
    badgeClassName: statusBadgeClass[status] ?? NEUTRAL,
  });
}

/** Order of the delivery timeline; qc_failed is a terminal branch, not a step. */
export const orderStatusOrder: OrderStatus[] = [
  'sale_confirmed', 'admin_notified', 'qc_scheduled', 'qc_passed', 'pickup_scheduled', 'in_transit', 'delivered',
];
