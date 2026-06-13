import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { createAndEmitNotification } from '../services/socket.service';

// All KYC fields the admin is allowed to see (and only the admin).
const ADMIN_KISAN_FIELDS =
  'name email phone location isVerified verifiedAt profilePhoto fathersName marka ' +
  'farmerIdPhoto aadharCardPhoto bankPassbookPhoto bankDetails isActive createdAt';

export const getKisans = asyncHandler(async (req: Request, res: Response) => {
  const { verified, search, page = 1, limit = 20 } = req.query;

  const query: Record<string, any> = { role: 'kisan' };

  if (verified === 'true') query.isVerified = true;
  else if (verified === 'false') query.isVerified = false;

  if (search) {
    const re = new RegExp(String(search), 'i');
    query.$or = [{ name: re }, { email: re }, { phone: re }, { location: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [kisans, total] = await Promise.all([
    User.find(query)
      .select(ADMIN_KISAN_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: kisans,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

export const setKisanVerification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isVerified } = req.body as { isVerified: boolean };

  const kisan = await User.findOne({ _id: id, role: 'kisan' });
  if (!kisan) throw new ApiError(404, 'Kisan not found');

  const alreadySame = kisan.isVerified === isVerified;
  if (!alreadySame) {
    kisan.isVerified = isVerified;
    if (isVerified) kisan.verifiedAt = new Date();
    await kisan.save();

    createAndEmitNotification({
      type: isVerified ? 'kisan_verified' : 'kisan_unverified',
      message: isVerified
        ? 'Your account has been verified by the admin. Your listings will now show as verified.'
        : 'Your account verification has been revoked by the admin.',
      payload: { isVerified },
      targetRole: 'kisan',
      targetUserId: kisan._id.toString(),
    }).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: isVerified ? 'Kisan verified successfully' : 'Kisan verification revoked',
    data: {
      _id: kisan._id,
      isVerified: kisan.isVerified,
      verifiedAt: kisan.verifiedAt,
    },
  });
});
