import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "@kropi/schemas/enum";

export interface IUser extends Document {
  email: string;
  password?: string;
  phone?: string;
  name?: string;
  role: UserRole;
  profilePhoto?: string;
  location?: string;
  farmerIdPhoto?: string;
  aadharCardPhoto?: string;
  bankPassbookPhoto?: string;
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  isVerified: boolean;
  verifiedAt?: Date;
  averageRating: number;
  totalRatings: number;
  refreshTokenHash?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
    },
    role: {
      type: String,
      enum: ["kisan", "buyer", "driver", "admin"],
      default: "kisan",
    },
    profilePhoto: {
      type: String,
    },
    location: {
      type: String,
    },
    farmerIdPhoto: {
      type: String,
    },
    aadharCardPhoto: {
      type: String,
    },
    bankPassbookPhoto: {
      type: String,
    },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    refreshTokenHash: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
