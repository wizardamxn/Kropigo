import mongoose, { Document, Schema } from 'mongoose';
import { CropUnit, ListingStatus } from '@kropi/schemas/enum';

export interface IListing extends Document {
  cropId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  quantity: number;
  unit: CropUnit;
  askingPrice: number;
  description?: string;
  mediaUrls: string[];
  status: ListingStatus;
  farmAddress: string;
  farmState: string;
  farmDistrict: string;
  farmCoordinates?: {
    lat: number;
    lng: number;
  };
  expiresAt: Date;
  viewCount: number;
  interestedBuyerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      required: true,
    },
    askingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    mediaUrls: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 6;
        },
        message: 'A listing can have a maximum of 6 media files.',
      },
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'interest_received', 'sale_confirmed', 'cancelled', 'expired', 'closed'],
      default: 'draft',
      required: true,
    },
    farmAddress: {
      type: String,
      required: true,
    },
    farmState: {
      type: String,
      required: true,
    },
    farmDistrict: {
      type: String,
      required: true,
    },
    farmCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    expiresAt: {
      type: Date,
      default: () => {
        // Default to 7 days from now
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      },
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestedBuyerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes as per requirements
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ cropId: 1, status: 1 });
listingSchema.index({ farmDistrict: 1, status: 1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
