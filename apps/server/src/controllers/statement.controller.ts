import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DailyStatement } from '../models/DailyStatement.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

/**
 * GET /api/v1/statements
 * Returns the caller's day-wise statements (newest first). Admins may pass
 * ?sellerId=... to view a specific farmer's statements.
 */
export const getMyStatements = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { page = 1, limit = 30, sellerId } = req.query;

  // Only admins can view someone else's statements.
  const targetSellerId = role === 'admin' && sellerId ? String(sellerId) : userId;

  const sellerObjectId = new mongoose.Types.ObjectId(targetSellerId);
  const query = { sellerId: sellerObjectId };
  const skip = (Number(page) - 1) * Number(limit);

  const [statements, total, summaryRows] = await Promise.all([
    DailyStatement.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit)),
    DailyStatement.countDocuments(query),
    // Lifetime rollup across all of this farmer's statements.
    DailyStatement.aggregate([
      { $match: { sellerId: sellerObjectId } },
      {
        $group: {
          _id: '$sellerId',
          lifetimeSales: { $sum: '$totalSales' },
          lifetimeAmount: { $sum: '$totalAmount' },
        },
      },
    ]),
  ]);

  const summary = summaryRows[0];

  res.status(200).json({
    success: true,
    data: statements,
    summary: {
      lifetimeSales: summary?.lifetimeSales ?? 0,
      lifetimeAmount: summary?.lifetimeAmount ?? 0,
    },
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * GET /api/v1/statements/summary
 * Per-crop rollup of every selling for the caller (or ?sellerId= for admins).
 * Used to render the printable statement grouped by crop.
 */
export const getStatementSummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { sellerId } = req.query;
  const targetSellerId = role === 'admin' && sellerId ? String(sellerId) : userId;
  const sellerObjectId = new mongoose.Types.ObjectId(targetSellerId);

  const rows = await DailyStatement.aggregate([
    { $match: { sellerId: sellerObjectId } },
    { $unwind: '$entries' },
    {
      $group: {
        _id: { crop: '$entries.cropName', grade: '$entries.grade', unit: '$entries.unit' },
        quantity: { $sum: '$entries.quantity' },
        amount: { $sum: '$entries.totalAmount' },
        sales: { $sum: 1 },
        firstSale: { $min: '$entries.soldAt' },
        lastSale: { $max: '$entries.soldAt' },
      },
    },
    { $sort: { amount: -1 } },
  ]);

  const crops = rows.map((r) => ({
    cropName: r._id.crop,
    grade: r._id.grade ?? null,
    unit: r._id.unit,
    quantity: r.quantity,
    amount: r.amount,
    sales: r.sales,
    firstSale: r.firstSale,
    lastSale: r.lastSale,
  }));

  const totals = crops.reduce(
    (acc, c) => {
      acc.sales += c.sales;
      acc.amount += c.amount;
      return acc;
    },
    { sales: 0, amount: 0 },
  );

  res.status(200).json({
    success: true,
    data: {
      crops,
      totals,
      periodStart: crops.length ? crops.reduce((min, c) => (c.firstSale < min ? c.firstSale : min), crops[0].firstSale) : null,
      periodEnd: crops.length ? crops.reduce((max, c) => (c.lastSale > max ? c.lastSale : max), crops[0].lastSale) : null,
    },
  });
});
