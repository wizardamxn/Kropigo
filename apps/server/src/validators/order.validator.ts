import { z } from 'zod';
import type { OrderStatus } from '@kropi/schemas/enum';

// sale_confirmed is intentionally excluded — that status is set automatically on order creation.
// Admin can only transition from admin_notified onwards. Local literal (no runtime import of
// the shared package); `satisfies` catches drift from OrderStatus.
const VALID_ADMIN_ORDER_STATUSES = [
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'qc_failed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
] as const satisfies readonly OrderStatus[];

export const updateOrderStatusSchema = z.object({
  status: z.enum(VALID_ADMIN_ORDER_STATUSES, {
    error: `Status must be one of: ${VALID_ADMIN_ORDER_STATUSES.join(', ')}`,
  }),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});

