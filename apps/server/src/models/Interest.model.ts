import mongoose, { Document, Schema } from 'mongoose';
import { InterestStatus } from '@kropi/schemas/enum';

export interface IInterest extends Document {
  listingId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  price: number;
  quantity?: number;
  status: InterestStatus;
  notes?: string;
  isReadBySeller: boolean;
  orderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const interestSchema = new Schema<IInterest>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      required: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    isReadBySeller: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
interestSchema.index({ listingId: 1, status: 1 });
interestSchema.index({ buyerId: 1, status: 1 });

export const Interest = mongoose.model<IInterest>('Interest', interestSchema);
