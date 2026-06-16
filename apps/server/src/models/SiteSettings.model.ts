import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSettings extends Document {
  key: string;
  isLaunched: boolean;
  launchedAt?: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true },
    isLaunched: { type: Boolean, default: false },
    launchedAt: { type: Date },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
