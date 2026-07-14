import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { setServers } from 'node:dns/promises';
import { Order } from '../src/models/Order.model';
import '../src/models/Listing.model';
import '../src/models/Crop.model';
import '../src/models/user.model';
import { recordSaleInStatement } from '../src/services/statement.service';

setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

/**
 * Rebuilds daily statements from every existing confirmed order.
 * Safe to re-run — recordSaleInStatement is idempotent per orderId.
 */
async function backfill() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('📦 Connected to MongoDB');

    const orders = await Order.find({})
      .populate({ path: 'listingId', select: 'grade cropId', populate: { path: 'cropId', select: 'name' } })
      .populate('buyerId', 'name')
      .sort({ createdAt: 1 });

    console.log(`⏳ Backfilling ${orders.length} orders...`);
    let recorded = 0;

    for (const order of orders) {
      const listing = order.listingId as any;
      await recordSaleInStatement({
        orderId: order._id,
        sellerId: order.sellerId,
        listingId: listing?._id,
        cropName: listing?.cropId?.name ?? 'Fasal',
        grade: listing?.grade,
        quantity: order.quantity,
        unit: order.unit,
        agreedPrice: order.agreedPrice,
        totalAmount: order.totalAmount,
        buyerName: (order.buyerId as any)?.name,
        soldAt: order.createdAt,
      });
      recorded++;
    }

    console.log(`✅ Backfill complete. Processed ${recorded} orders into daily statements.`);
  } catch (error) {
    console.error('❌ Error backfilling statements:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

backfill();
