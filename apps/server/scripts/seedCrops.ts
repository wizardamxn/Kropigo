import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Crop } from '../src/models/Crop.model';
import { CropCategory, CropUnit } from '../../../packages/schemas/src/enum';
import path from 'path';
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);
// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const cropsToSeed: { name: string; category: CropCategory; unit: CropUnit }[] = [
  // Vegetables
  { name: 'tomato', category: 'vegetable', unit: 'quintal' },
  { name: 'onion', category: 'vegetable', unit: 'quintal' },
  { name: 'potato', category: 'vegetable', unit: 'quintal' },
  { name: 'garlic', category: 'vegetable', unit: 'quintal' },
  { name: 'cauliflower', category: 'vegetable', unit: 'quintal' },
  { name: 'cabbage', category: 'vegetable', unit: 'quintal' },
  { name: 'brinjal', category: 'vegetable', unit: 'quintal' },
  { name: 'okra', category: 'vegetable', unit: 'quintal' },
  { name: 'spinach', category: 'vegetable', unit: 'kg' },
  { name: 'peas', category: 'vegetable', unit: 'quintal' },
  { name: 'bitter gourd', category: 'vegetable', unit: 'quintal' },
  { name: 'bottle gourd', category: 'vegetable', unit: 'quintal' },

  // Fruits
  { name: 'mango', category: 'fruit', unit: 'ton' },
  { name: 'banana', category: 'fruit', unit: 'quintal' },
  { name: 'watermelon', category: 'fruit', unit: 'quintal' },
  { name: 'grapes', category: 'fruit', unit: 'quintal' },
  { name: 'pomegranate', category: 'fruit', unit: 'quintal' },
  { name: 'guava', category: 'fruit', unit: 'quintal' },
  { name: 'apple', category: 'fruit', unit: 'quintal' },
  { name: 'orange', category: 'fruit', unit: 'quintal' },
  { name: 'papaya', category: 'fruit', unit: 'quintal' },

  // Grains
  { name: 'wheat', category: 'grain', unit: 'quintal' },
  { name: 'rice', category: 'grain', unit: 'quintal' },
  { name: 'bajra', category: 'grain', unit: 'quintal' },
  { name: 'jowar', category: 'grain', unit: 'quintal' },
  { name: 'chickpea', category: 'grain', unit: 'quintal' },
  { name: 'lentils', category: 'grain', unit: 'quintal' },
  { name: 'soybean', category: 'grain', unit: 'quintal' },

  // Spices
  { name: 'chilli', category: 'spice', unit: 'quintal' },
  { name: 'turmeric', category: 'spice', unit: 'quintal' },
  { name: 'ginger', category: 'spice', unit: 'quintal' },
  { name: 'coriander', category: 'spice', unit: 'kg' },
  { name: 'fenugreek', category: 'spice', unit: 'kg' },
  { name: 'cumin', category: 'spice', unit: 'kg' },
  { name: 'black pepper', category: 'spice', unit: 'kg' },
  { name: 'cardamom', category: 'spice', unit: 'kg' },

  // Other (Cash Crops/Oilseeds)
  { name: 'cotton', category: 'other', unit: 'quintal' },
  { name: 'sugarcane', category: 'other', unit: 'ton' },
  { name: 'groundnut', category: 'other', unit: 'quintal' },
  { name: 'mustard', category: 'other', unit: 'quintal' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('📦 Connected to MongoDB');

    let inserted = 0;
    let skipped = 0;

    for (const crop of cropsToSeed) {
      const existing = await Crop.findOne({ name: crop.name });
      if (existing) {
        skipped++;
        continue;
      }
      await Crop.create(crop);
      inserted++;
    }

    console.log(`✅ Seeding complete. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  } catch (error) {
    console.error('❌ Error seeding crops:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
