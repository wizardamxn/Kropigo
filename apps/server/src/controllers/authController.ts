import { Request, Response, RequestHandler } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";

import { Otp } from "../models/otp.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

/*
// --- Rate Limiter ---
export const otpLimiter: RequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per IP
  message: "Too many OTP requests, please try again later.",
  handler: (req, res, next, options) => {
    next(new ApiError(429, options.message));
  },
});

// --- Zod Schemas ---
const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});
*/

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["kisan", "buyer", "driver", "admin"]).default("kisan"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- Helper ---
const issueTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
  return { accessToken, refreshToken };
};

// --- Controllers ---

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, phone, password, role } = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new ApiError(400, "User with this email or phone already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: true,
    });

    const { accessToken, refreshToken } = issueTokens(user.id, user.role);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(new ApiResponse(201, { accessToken, user: userResponse }, "User registered successfully"));
  }
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(400, "Invalid email or password");
    }

    if (!user.password) {
      throw new ApiError(400, "Invalid credentials. If you signed up via OTP, please try that instead.");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(400, "Invalid email or password");
    }

    const { accessToken, refreshToken } = issueTokens(user.id, user.role);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json(new ApiResponse(200, { accessToken, user: userResponse }, "Logged in successfully"));
  }
);

/*
export const sendOtp: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone } = sendOtpSchema.parse(req.body);

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Upsert OTP (only one active OTP per phone)
    await Otp.findOneAndUpdate(
      { phone },
      { phone, hashedOtp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Call MSG91 API
    try {
      // MSG91 Send OTP API (V5)
      // We pass the generated OTP in the URL. If the template has variables, they go in the body.
      const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${env.MSG91_TEMPLATE_ID}&mobile=91${phone}&otp=${otp}`;

      const msg91Response = await fetch(msg91Url, {
        method: "POST",
        headers: {
          authkey: env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otp, // ##OTP## maps to this — keep ONLY this one
        }),
      });
      const msg91Data = (await msg91Response.json()) as any;

      if (msg91Data.type === "error") {
        console.error("[MSG91 Error]", msg91Data);
        throw new Error(msg91Data.message || "MSG91 API returned an error");
      }

      console.log(`[MSG91] OTP sent successfully to ${phone}`);
    } catch (err: any) {
      console.error("[MSG91 Failed]", err.message);
      // Even if SMS fails, we might want to throw an error so the user knows to retry.
      throw new ApiError(500, "Failed to send SMS. Please try again later.");
    }

    res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
  },
);

export const verifyOtp: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone, otp } = verifyOtpSchema.parse(req.body);

    const otpRecord = await Otp.findOne({ phone });
    if (!otpRecord) {
      throw new ApiError(400, "OTP expired or not found");
    }

    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);
    if (!isValid) {
      throw new ApiError(400, "Invalid OTP");
    }

    // OTP is single-use, delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find or Create User
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, role: "kisan" });
    }

    const { accessToken, refreshToken } = issueTokens(user.id, user.role);

    // Store refresh token hash securely
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    // Set httpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, user },
          "OTP verified successfully",
        ),
      );
  },
);
*/

export const refresh: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new ApiError(401, "No refresh token provided");
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
      };
    } catch (err) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokenHash) {
      throw new ApiError(401, "Invalid refresh token session");
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      user.refreshTokenHash = undefined;
      await user.save();
      throw new ApiError(
        401,
        "Invalid refresh token (reused). Session terminated.",
      );
    }

    // Issue new tokens (Token Rotation)
    const tokens = issueTokens(user.id, user.role);

    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await user.save();

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: tokens.accessToken },
          "Token refreshed",
        ),
      );
  },
);

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
          userId: string;
        };
        const user = await User.findById(decoded.userId);
        if (user) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      } catch (err) { }
    }

    res.clearCookie("refreshToken");
    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  },
);

/*
// --- Webhooks ---
export const msg91Webhook: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // MSG91 might send data as GET query params or POST body
    const payload = req.method === "POST" ? req.body : req.query;

    console.log(
      "🔔 [MSG91 Webhook Received]",
      JSON.stringify(payload, null, 2),
    );

    // Extract relevant information (example structure, actual structure may vary based on MSG91 config)
    // const { requestid, status, mobile } = payload;

    // You can process the delivery status here (e.g., updating a log in the database)
    // For now, we just acknowledge receipt to MSG91

    res.status(200).send("OK");
  },
);
*/
