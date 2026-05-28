import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  // cross-origin (Netlify → Render): 'none' requires secure:true; locally 'lax' is fine
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: env.JWT_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
};

// --- Zod Schemas ---
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
const signToken = (userId: string, role: string) =>
  jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_COOKIE_EXPIRY_DAYS}d`,
  });

const buildUserResponse = (user: any) => ({
  id: user.id || user._id,
  email: user.email,
  phone: user.phone,
  name: user.name,
  role: user.role,
  location: user.location,
  profilePhoto: user.profilePhoto,
  farmerIdPhoto: user.farmerIdPhoto,
  aadharCardPhoto: user.aadharCardPhoto,
  bankPassbookPhoto: user.bankPassbookPhoto,
  bankDetails: user.bankDetails,
  isVerified: user.isVerified,
  isActive: user.isActive,
});

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

    const token = signToken(user.id, user.role);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.status(201).json(
      new ApiResponse(201, { user: buildUserResponse(user) }, "Registered successfully")
    );
  }
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new ApiError(400, "Invalid email or password");
    if (!user.password) throw new ApiError(400, "Invalid credentials");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new ApiError(400, "Invalid email or password");

    const token = signToken(user.id, user.role);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    res.status(200).json(
      new ApiResponse(200, { user: buildUserResponse(user) }, "Logged in successfully")
    );
  }
);

export const me: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // req.user is populated by the authenticate middleware
    const user = await User.findById((req as any).user?.userId);
    if (!user) throw new ApiError(401, "User not found");

    res.status(200).json(
      new ApiResponse(200, { user: buildUserResponse(user) }, "User fetched")
    );
  }
);

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  }
);
