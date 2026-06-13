import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/user.model';
import { createAndEmitNotification } from '../services/socket.service';

// All KYC fields the admin is allowed to see (and only the admin).
const ADMIN_USER_FIELDS =
  'name email phone location isVerified verifiedAt profilePhoto fathersName marka ' +
  'farmerIdPhoto aadharCardPhoto bankPassbookPhoto bankDetails isActive createdAt role';

export const getKisans = asyncHandler(async (req: Request, res: Response) => {
  const { verified, search, page = 1, limit = 20, role = 'kisan' } = req.query;

  // Only allow admins to query kisan or buyer roles
  const queryRole = role === 'buyer' ? 'buyer' : 'kisan';
  const query: Record<string, any> = { role: queryRole };

  if (verified === 'true') query.isVerified = true;
  else if (verified === 'false') query.isVerified = false;

  if (search) {
    const re = new RegExp(String(search), 'i');
    query.$or = [{ name: re }, { email: re }, { phone: re }, { location: re }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select(ADMIN_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: users,
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

  const user = await User.findOne({ _id: id, role: { $in: ['kisan', 'buyer'] } });
  if (!user) throw new ApiError(404, 'User not found');

  const alreadySame = user.isVerified === isVerified;
  if (!alreadySame) {
    user.isVerified = isVerified;
    if (isVerified) user.verifiedAt = new Date();
    await user.save();

    const isKisan = user.role === 'kisan';
    const notifType = isKisan
      ? (isVerified ? 'kisan_verified' : 'kisan_unverified')
      : (isVerified ? 'buyer_verified' : 'buyer_unverified');

    const notifMessage = isKisan
      ? (isVerified
          ? 'Your account has been verified by the admin. Your listings will now show as verified.'
          : 'Your account verification has been revoked by the admin.')
      : (isVerified
          ? 'Your buyer account has been verified by the admin. You can now trade on the marketplace.'
          : 'Your buyer account verification has been revoked by the admin.');

    createAndEmitNotification({
      type: notifType,
      message: notifMessage,
      payload: { isVerified },
      targetRole: user.role as 'kisan' | 'buyer',
      targetUserId: user._id.toString(),
    }).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: isVerified ? 'User verified successfully' : 'User verification revoked',
    data: {
      _id: user._id,
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
    },
  });
});
