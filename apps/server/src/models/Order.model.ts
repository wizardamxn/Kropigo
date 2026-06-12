import mongoose, { Schema, Document } from 'mongoose';
import type { OrderStatus } from '@kropi/schemas/enum';

// Mirrors OrderStatusSchema in @kropi/schemas. Kept as a local literal so the server
// has no runtime import of the shared package (it isn't a linked node module); the
// `satisfies` check fails compilation if this drifts to an invalid status.
const ORDER_STATUSES = [
  'sale_confirmed',
  'admin_notified',
  'qc_scheduled',
  'qc_passed',
  'qc_failed',
  'pickup_scheduled',
  'in_transit',
  'delivered',
] as const satisfies readonly OrderStatus[];

export interface ITimelineEntry {
  status: string;
  timestamp: Date;
  actorId: mongoose.Types.ObjectId;
  note?: string;
}

export interface IOrder extends Document {
  listingId: mongoose.Types.ObjectId;
  interestId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  agreedPrice: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  status: OrderStatus;
  timeline: ITimelineEntry[];
  billUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: null }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  listingId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true 
  },
  interestId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Interest', 
    required: true 
  },
  buyerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sellerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  agreedPrice: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  unit: { 
    type: String, 
    required: true 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: {
    type: String,
    enum: [...ORDER_STATUSES],
    default: 'sale_confirmed' satisfies OrderStatus,
  },
  timeline: [TimelineEntrySchema],
  billUrl: { 
    type: String, 
    default: null 
  }
}, { timestamps: true });

OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
