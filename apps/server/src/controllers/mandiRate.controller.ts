import { Request, Response } from 'express';
import { MandiRate } from '../models/MandiRate.model';
import { Crop } from '../models/Crop.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

export const getMandiRatesByCrop = asyncHandler(async (req: Request, res: Response) => {
  const { cropId } = req.params;

  // Check if crop exists
  const crop = await Crop.findById(cropId);
  if (!crop) throw new ApiError(404, 'Crop not found');

  // Get rates from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rates = await MandiRate.find({
    cropId,
    date: { $gte: sevenDaysAgo }
  }).sort({ date: -1 });

  res.status(200).json({ success: true, data: rates });
});

export const createManualMandiRate = asyncHandler(async (req: Request, res: Response) => {
  const { cropId, market, state, minPrice, maxPrice, modalPrice, unit, date } = req.body;

  // Ensure date is set properly (defaults to today)
  const rateDate = date ? new Date(date) : new Date();
  rateDate.setHours(0, 0, 0, 0);

  // Upsert the manual rate
  const rate = await MandiRate.findOneAndUpdate(
    { cropId, market, date: rateDate, source: 'manual' },
    { minPrice, maxPrice, modalPrice, unit, state },
    { new: true, upsert: true }
  );

  res.status(201).json({ success: true, data: rate });
});
