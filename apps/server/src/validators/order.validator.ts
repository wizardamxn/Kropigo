import { z } from 'zod';

// sale_confirmed is intentionally excluded — that status is set automatically on order creation.
// Admin can only set statuses from admin_notified onwards.
const VALID_ORDER_STATUSES = [
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'qc_failed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
] as const;

export const updateOrderStatusSchema = z.object({
  // Zod v4: errorMap → error; spread the const tuple for correct inference
  status: z.enum(VALID_ORDER_STATUSES, {
    error: `Status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`,
  }),
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
});

