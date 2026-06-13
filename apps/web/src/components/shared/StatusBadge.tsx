'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, ListingStatus, InterestStatus } from '@kropi/schemas/enum';

export type AnyStatus = OrderStatus | ListingStatus | InterestStatus;

// Semantic color per status, layered over the Badge base (last class wins via tailwind-merge).
import { STATUS_COLORS } from './statusHelper';

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
