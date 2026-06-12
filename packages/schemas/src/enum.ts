import { z } from 'zod';

// --- User Roles ---
export const UserRoleSchema = z.enum(['kisan', 'buyer', 'driver', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// --- Listing Status ---
export const ListingStatusSchema = z.enum([
  'draft',
  'open',
  'interest_received',
  'sale_confirmed',
  'cancelled',
  'expired',
  'closed'
]);
export type ListingStatus = z.infer<typeof ListingStatusSchema>;

// --- Interest Status ---
export const InterestStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
]);
export type InterestStatus = z.infer<typeof InterestStatusSchema>;

// --- Order Status ---
export const OrderStatusSchema = z.enum([
  'sale_confirmed',
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'qc_failed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const ORDER_STATUSES = OrderStatusSchema.options;
export const TERMINAL_ORDER_STATUSES = ['qc_failed', 'delivered'] as const;

// --- Transport Request Status ---
export const TransportRequestStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]);
export type TransportRequestStatus = z.infer<typeof TransportRequestStatusSchema>;

// --- Payment Status ---
export const PaymentStatusSchema = z.enum([
  'created',
  'paid',
  'failed',
  'refunded',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// --- Review Target ---
export const ReviewTargetSchema = z.enum(['kisan', 'buyer', 'driver']);
export type ReviewTarget = z.infer<typeof ReviewTargetSchema>;

// --- Crop ---
export const CropCategorySchema = z.enum(['vegetable', 'fruit', 'grain', 'spice', 'flower', 'other']);
export type CropCategory = z.infer<typeof CropCategorySchema>;

export const CropUnitSchema = z.enum(['kg', 'quintal', 'ton']);
export type CropUnit = z.infer<typeof CropUnitSchema>;

// --- Mandi Rate ---
export const MandiRateSourceSchema = z.enum(['agmarknet', 'manual']);
export type MandiRateSource = z.infer<typeof MandiRateSourceSchema>;
