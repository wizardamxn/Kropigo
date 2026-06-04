import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/user.model';
import { Crop } from '../src/models/Crop.model';
import { Listing } from '../src/models/Listing.model';
import { Interest } from '../src/models/Interest.model';
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

    // 1. Get or create a Kisan user
    let kisan = await User.findOne({ email : "amankisan1@gmail.com"});
    if (!kisan) {
      kisan = await User.create({
        email: 'kisan@kropigo.com',
        phone: '9876543210',
        name: 'Ram Singh Kisan',
        role: 'kisan',
        isVerified: true,
        isActive: true,
      });
      console.log('Created sample Kisan:', kisan.name);
    } else {
      console.log('Found existing Kisan:', kisan.name);
    }

    // 2. Get or create a Buyer user
    let buyer1: any = await User.findOne({ email: 'buyer1@kropigo.com' });
    if (!buyer1) {
      buyer1 = await User.create({
        email: 'buyer1@kropigo.com',
        phone: '9988776655',
        name: 'Rajesh Agro Trading',
        role: 'buyer',
        isVerified: true,
        isActive: true,
      });
      console.log('Created buyer 1:', buyer1.name);
    }

    let buyer2: any = await User.findOne({ email: 'buyer2@kropigo.com' });
    if (!buyer2) {
      buyer2 = await User.create({
        email: 'buyer2@kropigo.com',
        phone: '9988776644',
        name: 'Karan Mandi Distributor',
        role: 'buyer',
        isVerified: true,
        isActive: true,
      });
      console.log('Created buyer 2:', buyer2.name);
    }

    // 3. Get some crops
    const tomato = await Crop.findOne({ name: 'tomato' });
    const wheat = await Crop.findOne({ name: 'wheat' });
    if (!tomato || !wheat) {
      console.error('Crops are not seeded yet. Please run pnpm seed:crops first.');
      process.exit(1);
    }

    // Clear old sample listings and interests
    await Listing.deleteMany({ sellerId: kisan._id });
    await Interest.deleteMany({});

    // 4. Create sample listings
    const listing1 = await Listing.create({
      cropId: tomato._id,
      sellerId: kisan._id,
      quantity: 50,
      unit: 'quintal',
      description: 'Fresh organic tomatoes, harvested yesterday. Ready for pick-up.',
      mediaUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop'],
      status: 'interest_received',
      farmAddress: 'Farm No 12, Mandi Road, Sonipat',
      farmState: 'Haryana',
      farmDistrict: 'Sonipat',
      farmCoordinates: { lat: 28.99, lng: 77.01 },
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const listing2 = await Listing.create({
      cropId: wheat._id,
      sellerId: kisan._id,
      quantity: 200,
      unit: 'quintal',
      description: 'Sharbati premium wheat. Well stored in dry silos.',
      mediaUrls: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop'],
      status: 'open',
      farmAddress: 'Plot 4, Near Canal, Karnal',
      farmState: 'Haryana',
      farmDistrict: 'Karnal',
      farmCoordinates: { lat: 29.68, lng: 76.99 },
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });

    const listing3 = await Listing.create({
      cropId: wheat._id,
      sellerId: kisan._id,
      quantity: 150,
      unit: 'quintal',
      description: 'Standard wheat. Harvested last month.',
      status: 'sale_confirmed',
      farmAddress: 'Plot 4, Near Canal, Karnal',
      farmState: 'Haryana',
      farmDistrict: 'Karnal',
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // expired/sold
    });

    console.log('Created sample listings for Kisan');

    // 5. Create buyer interests
    // For listing 1 (Tomatoes - status: interest_received)
    await Interest.create({
      listingId: listing1._id,
      buyerId: buyer1!._id,
      price: 1150,
      quantity: 50,
      status: 'pending',
      notes: 'We can arrange pickup tomorrow morning. Direct payment.',
      isReadBySeller: false,
    });

    await Interest.create({
      listingId: listing1._id,
      buyerId: buyer2!._id,
      price: 1250, // Higher than asking price!
      quantity: 50,
      status: 'pending',
      notes: 'Need this urgently. Offering extra. Payment on arrival.',
      isReadBySeller: false,
    });

    // For listing 3 (Wheat - status: sale_confirmed)
    await Interest.create({
      listingId: listing3._id,
      buyerId: buyer1!._id,
      price: 2050,
      quantity: 150,
      status: 'accepted',
      notes: 'Confirmed deal.',
      isReadBySeller: true,
    });

    console.log('Seeded interests successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding interests failed:', error);
    process.exit(1);
  }
}

run();
