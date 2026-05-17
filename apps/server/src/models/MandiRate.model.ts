import mongoose, { Document, Schema } from 'mongoose';
import { MandiRateSource, CropUnit } from '@kropi/schemas/enum';

export interface IMandiRate extends Document {
  cropId: mongoose.Types.ObjectId;
  market: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: CropUnit;
  date: Date;
  source: MandiRateSource;
  createdAt: Date;
  updatedAt: Date;
}

const mandiRateSchema = new Schema<IMandiRate>(
  {
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    minPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: ['agmarknet', 'manual'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast queries to get the latest rate for a specific crop
mandiRateSchema.index({ cropId: 1, date: -1 });

export const MandiRate = mongoose.model<IMandiRate>('MandiRate', mandiRateSchema);
