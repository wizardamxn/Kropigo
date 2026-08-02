import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { Otp } from "../models/otp.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { generateOtp, sendOtpSms, signPhoneVerificationToken, OTP_TTL_MS } from "../services/otp.service";

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
});

const sendOtpSchema = phoneSchema.extend({
  email: z.string().email("Invalid email format"),
});

const verifyOtpSchema = phoneSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const sendOtp: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, email } = sendOtpSchema.parse(req.body);

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new ApiError(400, "An account with this email or phone number already exists");
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.findOneAndUpdate(
      { phone },
      { hashedOtp, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpSms(phone, otp);

    res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
  }
);

export const verifyOtp: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    const record = await Otp.findOne({ phone });
    if (!record) {
      throw new ApiError(400, "OTP not found or already used. Please request a new one.");
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await record.deleteOne();
      throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    const isValid = await bcrypt.compare(otp, record.hashedOtp);
    if (!isValid) {
      throw new ApiError(400, "Invalid OTP");
    }

    await record.deleteOne();

    const verificationToken = signPhoneVerificationToken(phone);

    res.status(200).json(
      new ApiResponse(200, { verificationToken }, "Phone number verified successfully")
    );
  }
);
