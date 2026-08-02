import mongoose from 'mongoose';
import { DailyStatement, IStatementEntry } from '../models/DailyStatement.model';
import { createAndEmitNotification } from './socket.service';
import { SOCKET_EVENTS } from '../utils/socketEvents';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // India Standard Time = UTC+5:30

/**
 * Returns the IST calendar day for a given instant:
 *  - dateKey: 'YYYY-MM-DD' (used to group/dedupe statements day-wise)
 *  - date:    UTC instant of that IST day's 00:00 (stable sort/display anchor)
 */
export function istDayKey(instant: Date = new Date()): { dateKey: string; date: Date } {
  const ist = new Date(instant.getTime() + IST_OFFSET_MS);
  const dateKey = ist.toISOString().slice(0, 10); // YYYY-MM-DD in IST
  const date = new Date(Date.parse(`${dateKey}T00:00:00.000Z`) - IST_OFFSET_MS);
  return { dateKey, date };
}

/**
 * Record a confirmed sale on the seller's statement for the day it happened.
 *
 * Idempotent: the entry is only added if no entry with the same orderId already
 * exists on that day's statement, so retries/backfills never double-count.
 * Safe to call fire-and-forget after a deal is confirmed.
 */
export async function recordSaleInStatement(sale: {
  orderId: mongoose.Types.ObjectId | string;
  sellerId: mongoose.Types.ObjectId | string;
  listingId?: mongoose.Types.ObjectId | string;
  cropName: string;
  grade?: string;
  quantity: number;
  unit: string;
  agreedPrice: number;
  totalAmount: number;
  buyerName?: string;
  soldAt?: Date;
}): Promise<void> {
  const soldAt = sale.soldAt ?? new Date();
  const { dateKey, date } = istDayKey(soldAt);
  const orderId = new mongoose.Types.ObjectId(sale.orderId);
  const sellerId = new mongoose.Types.ObjectId(sale.sellerId);

  // Coerce numerics — legacy orders may have missing fields, which would otherwise
  // fail the $inc casts. Fall back to agreedPrice × quantity for a missing total.
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const quantity = num(sale.quantity);
  const agreedPrice = num(sale.agreedPrice);
  const totalAmount = num(sale.totalAmount) || agreedPrice * quantity;

  const entry: IStatementEntry = {
    orderId,
    listingId: sale.listingId ? new mongoose.Types.ObjectId(sale.listingId) : undefined,
    cropName: sale.cropName,
    grade: sale.grade,
    quantity,
    unit: sale.unit,
    agreedPrice,
    totalAmount,
    buyerName: sale.buyerName,
    soldAt,
  };

  // Ensure the day's statement exists (upsert) without disturbing existing entries.
  await DailyStatement.updateOne(
    { sellerId, dateKey },
    { $setOnInsert: { sellerId, dateKey, date } },
    { upsert: true },
  );

  // Append + increment totals only if this order isn't already recorded today.
  const appended = await DailyStatement.updateOne(
    { sellerId, dateKey, 'entries.orderId': { $ne: orderId } },
    {
      $push: { entries: entry },
      $inc: {
        totalSales: 1,
        totalQuantity: quantity,
        totalAmount: totalAmount,
      },
    },
  );

  // Only notify when this call actually added the entry — the guard above makes
  // retries no-ops, and a retry must not re-notify the seller.
  if (appended.modifiedCount > 0) {
    createAndEmitNotification({
      type: SOCKET_EVENTS.STATEMENT_UPDATED,
      message: `Aapke statement mein nayi sale add hui: ${sale.cropName} - Rs.${totalAmount}`,
      payload: {
        dateKey,
        cropName: sale.cropName,
        quantity,
        unit: sale.unit,
        totalAmount,
      },
      targetRole: 'kisan',
      targetUserId: sellerId.toString(),
      orderId: orderId.toString(),
    }).catch((err) => {
      console.error('Statement notification failed:', err);
    });
  }
}
