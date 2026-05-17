import mongoose, { Document, Schema } from 'mongoose';
import { CropCategory, CropUnit } from '@kropi/schemas/enum';

export interface ICrop extends Document {
  name: string;
  category: CropCategory;
  unit: CropUnit;
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
