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
  'payment_pending',
  'payment_done',
  'dispatched',
  'arrived_at_farm',
  'qc_rejected',
  'picked_up',
  'delivered',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

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


