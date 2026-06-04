import { Request, Response, RequestHandler } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['kisan', 'buyer', 'driver', 'admin']),
  location: z.string().optional(),
  profilePhoto: z.union([z.string().url(), z.literal('')]).optional(), // In a real scenario, handle file upload first and pass URL
  farmerIdPhoto: z.union([z.string().url(), z.literal('')]).optional(),
  aadharCardPhoto: z.union([z.string().url(), z.literal('')]).optional(),
  bankPassbookPhoto: z.union([z.string().url(), z.literal('')]).optional(),
  fathersName: z.string().max(200, "Father's name cannot exceed 200 characters").optional(),
  marka: z.string().max(5, "Marka cannot exceed 5 characters").optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional()
  }).optional(),
});

export const updateProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { name, role, location, profilePhoto, farmerIdPhoto, aadharCardPhoto, bankPassbookPhoto, bankDetails, fathersName, marka } = profileSchema.parse(req.body);

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Role cannot be changed after initial setup without admin intervention
  if (user.name && user.role !== role) {
    throw new ApiError(400, 'Role cannot be changed after initial setup. Contact admin.');
  }

  user.name = name;
  user.role = role as any;
  if (location !== undefined) user.location = location;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (farmerIdPhoto !== undefined) user.farmerIdPhoto = farmerIdPhoto;
  if (aadharCardPhoto !== undefined) user.aadharCardPhoto = aadharCardPhoto;
  if (bankPassbookPhoto !== undefined) user.bankPassbookPhoto = bankPassbookPhoto;
  if (bankDetails !== undefined) user.bankDetails = bankDetails;
  if (fathersName !== undefined) user.fathersName = fathersName;
  if (marka !== undefined) user.marka = marka;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});
