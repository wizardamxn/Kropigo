import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phone: string;
  hashedOtp: string;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: {
      type: String,
      required: true,
      unique: true, // Important for upsert logic
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from creation
    },
  },
  { timestamps: true }
);

// TTL Index: expireAfterSeconds: 0 means document expires at the exact time in 'expiresAt' field
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
