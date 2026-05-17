import cron from 'node-cron';
import { Listing } from '../models/Listing.model';
import { MandiRate } from '../models/MandiRate.model';

const TIMEZONE = 'Asia/Kolkata';

export const registerJobs = () => {
  // 1. closeListingWindow Job
  // Runs every day at 5:00 PM (17:00) IST
  cron.schedule('0 17 * * *', async () => {
    console.log('[CRON] Running closeListingWindow job at 5 PM IST');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all draft listings created today and make them open
      const result = await Listing.updateMany(
        { 
          status: 'draft',
          createdAt: { $gte: today } 
        },
        { $set: { status: 'open' } }
      );
      
      console.log(`[CRON] closeListingWindow: Updated ${result.modifiedCount} draft listings to open.`);
    } catch (error) {
      console.error('[CRON] closeListingWindow failed:', error);
    }
  }, { timezone: TIMEZONE });

  // 2. expireListings Job
  // Runs every day at midnight (00:00) IST
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running expireListings job at Midnight IST');
    try {
      const now = new Date();

      // Find all open listings where expiresAt is in the past
      const expiredListings = await Listing.find({
        status: 'open',
        expiresAt: { $lt: now }
      });

      if (expiredListings.length === 0) {
        console.log('[CRON] expireListings: No expired listings found.');
        return;
      }

      const ids = expiredListings.map(l => l._id);
      await Listing.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'cancelled' } }
      );

      console.log(`[CRON] expireListings: Cancelled ${ids.length} expired listings.`);
      
      // TODO: Simulate SMS sending to Kisans
      expiredListings.forEach(listing => {
        // console.log(`Simulating SMS to seller ${listing.sellerId}: "Your listing for crop ${listing.cropId} has expired and been cancelled."`);
      });

    } catch (error) {
      console.error('[CRON] expireListings failed:', error);
    }
  }, { timezone: TIMEZONE });

  // 3. fetchMandiRates Job
  // Runs every day at 8:00 AM IST
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running fetchMandiRates job at 8 AM IST');
    try {
      // TODO: Implement actual Agmarknet API integration here
      console.log('[CRON] fetchMandiRates: Agmarknet API integration pending. Skipping...');
    } catch (error) {
      console.error('[CRON] fetchMandiRates failed:', error);
    }
  }, { timezone: TIMEZONE });

  console.log('⏰ All Cron Jobs registered successfully.');
};
