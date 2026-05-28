import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/user.model';
import Notification from '../src/models/Notification.model';
import { setServers } from 'node:dns/promises';

setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Find all Kisans and Buyers to seed notifications for each of them
    const kisans = await User.find({ role: 'kisan' });
    const buyers = await User.find({ role: 'buyer' });

    console.log('Clearing existing notifications...');
    await Notification.deleteMany({});

    const notificationsToSeed = [];

    // 1. Seed 15 notifications for each Kisan (farmer)
    if (kisans.length > 0) {
      for (const kisan of kisans) {
        console.log(`Seeding 15 notifications for Kisan: ${kisan.email}`);
        for (let i = 1; i <= 15; i++) {
          notificationsToSeed.push({
            type: 'new_offer_received',
            orderId: null,
            listingId: new mongoose.Types.ObjectId(),
            message: `Kisan Notification #${i}: A buyer placed a new bid offer of Rs. ${1000 + i * 20} per quintal for your listing.`,
            payload: { listingId: new mongoose.Types.ObjectId().toString(), price: 1000 + i * 20 },
            isRead: false,
            targetRole: 'kisan',
            targetUserId: kisan._id,
            createdAt: new Date(Date.now() - i * 60 * 60 * 1000) // incrementally older
          });
        }
      }
    } else {
      console.log('No Kisan users found in database.');
    }

    // 2. Seed 15 notifications for Admin role (targetRole: admin, targetUserId: null)
    console.log('Seeding 15 notifications for Admin role...');
    for (let i = 1; i <= 15; i++) {
      notificationsToSeed.push({
        type: 'new_deal',
        orderId: new mongoose.Types.ObjectId(),
        listingId: null,
        message: `Admin Notification #${i}: New contract created between Kisan Ram and Buyer Rajesh.`,
        payload: { 
          orderId: new mongoose.Types.ObjectId().toString(),
          cropName: 'Tomato',
          quantity: 20 + i,
          unit: 'quintal',
          agreedPrice: 1500,
          totalAmount: 30000,
          kisanName: 'Ram Singh Kisan',
          kisanPhone: '9876543210',
          buyerName: 'Rajesh Agro Trading',
          buyerPhone: '9988776655',
          farmDistrict: 'Sonipat',
          farmState: 'Haryana'
        },
        isRead: false,
        targetRole: 'admin',
        targetUserId: null,
        createdAt: new Date(Date.now() - i * 45 * 60 * 1000) // incrementally older
      });
    }

    // 3. Seed 15 notifications for each Buyer
    if (buyers.length > 0) {
      for (const buyer of buyers) {
        console.log(`Seeding 15 notifications for Buyer: ${buyer.email}`);
        for (let i = 1; i <= 15; i++) {
          notificationsToSeed.push({
            type: 'order_status_updated',
            orderId: new mongoose.Types.ObjectId(),
            listingId: null,
            message: `Buyer Notification #${i}: Status of your quality clearance order was changed to QC_SCHEDULED.`,
            payload: { orderId: new mongoose.Types.ObjectId().toString(), status: 'qc_scheduled' },
            isRead: false,
            targetRole: 'buyer',
            targetUserId: buyer._id,
            createdAt: new Date(Date.now() - i * 30 * 60 * 1000) // incrementally older
          });
        }
      }
    } else {
      console.log('No Buyer users found in database.');
    }

    await Notification.insertMany(notificationsToSeed);
    console.log(`Successfully seeded ${notificationsToSeed.length} notifications!`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding notifications failed:', error);
    process.exit(1);
  }
}

run();
