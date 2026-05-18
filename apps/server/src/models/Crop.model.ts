import mongoose, { Document, Schema } from 'mongoose';
import { CropCategory, CropUnit } from '@kropi/schemas/enum';

export interface ICrop extends Document {
  name: string;
  nameHindi?: string;
  category: CropCategory;
  unit: CropUnit;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cropSchema = new Schema<ICrop>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    nameHindi: {
      type: String,
      required: false,
      trim: true,
    },
    category: {
      type: String,
      enum: ['vegetable', 'fruit', 'grain', 'spice', 'other'],
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize searches by category
cropSchema.index({ category: 1, isActive: 1 });

export const Crop = mongoose.model<ICrop>('Crop', cropSchema);
