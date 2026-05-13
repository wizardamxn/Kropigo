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
  profilePhoto: z.string().url().optional(), // In a real scenario, handle file upload first and pass URL
});

export const updateProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { name, role, location, profilePhoto } = profileSchema.parse(req.body);

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Role cannot be changed after initial setup without admin intervention
  if (user.name && user.role !== role) {
    throw new ApiError(400, 'Role cannot be changed after initial setup. Contact admin.');
  }

  user.name = name;
  user.role = role as any;
  if (location) user.location = location;
  if (profilePhoto) user.profilePhoto = profilePhoto;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});
