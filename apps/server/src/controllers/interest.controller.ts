import { Request, Response } from 'express';
import { Interest } from '../models/Interest.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

/**
 * GET /api/v1/interests/my
 * Returns all interests submitted by the authenticated buyer.
 * Supports ?status=pending|accepted|rejected|withdrawn&page=1&limit=10
 */
export const getMyInterests = asyncHandler(async (req: Request, res: Response) => {
  const buyerId = req.user?.userId;
  if (!buyerId) throw new ApiError(401, 'Unauthorized');

  const { status, page = 1, limit = 10 } = req.query;

  const query: Record<string, any> = { buyerId };
  if (status) query.status = status;

  const interests = await Interest.find(query)
    .populate({
      path: 'listingId',
      select: 'mediaUrls unit quantity status expiresAt',
      populate: [
        { path: 'cropId', select: 'name category' },
        { path: 'sellerId', select: 'name location isVerified' },
      ],
    })
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Interest.countDocuments(query);

  res.status(200).json({
    success: true,
    data: interests,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});
