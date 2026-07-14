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

// Only these four crops are supported on the platform. Any other crop already in
// the DB is deactivated (isActive:false) below so it disappears from listings while
// preserving referential integrity for historical listings/orders.
const cropsToSeed: { name: string; nameHindi: string; searchQuery: string; category: CropCategory; unit: CropUnit }[] = [
  { name: 'guava', nameHindi: 'अमरूद', searchQuery: 'guava', category: 'fruit', unit: 'quintal' },
  { name: 'chilli', nameHindi: 'मिर्च', searchQuery: 'chilli pepper', category: 'spice', unit: 'quintal' },
  { name: 'lemon', nameHindi: 'नींबू', searchQuery: 'lemon', category: 'fruit', unit: 'quintal' },
  { name: 'cucumber', nameHindi: 'खीरा', searchQuery: 'cucumber', category: 'vegetable', unit: 'quintal' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchUnsplashImage(query: string): Promise<string | undefined> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) {
    console.warn('⚠️ No UNSPLASH_ACCESS_KEY found in .env, skipping image fetch.');
    return undefined;
  }
  
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as any;
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch (error) {
    console.error(`Error fetching image for ${query}:`, error);
  }
  return undefined;
}

function generateDescription(name: string, nameHindi: string, category: string): string {
  return `Fresh and high-quality ${nameHindi} (${name}) ${category !== 'other' ? category : 'crop'} ready for the market.`;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('📦 Connected to MongoDB');

    const keepNames = cropsToSeed.map((c) => c.name);

    // Deactivate every crop that is no longer supported (keeps history intact).
    const deactivateResult = await Crop.updateMany(
      { name: { $nin: keepNames } },
      { $set: { isActive: false } }
    );
    console.log(`🚫 Deactivated ${deactivateResult.modifiedCount} unsupported crops.`);

    let insertedOrUpdated = 0;

    for (const crop of cropsToSeed) {
      console.log(`⏳ Processing ${crop.name}...`);

      const imageUrl = await fetchUnsplashImage(`${crop.searchQuery}`);
      const description = generateDescription(crop.name, crop.nameHindi, crop.category);

      const cropData = {
        ...crop,
        imageUrl,
        description,
        isActive: true,
      };

      await Crop.findOneAndUpdate(
        { name: crop.name },
        { $set: cropData },
        { upsert: true, new: true }
      );
      insertedOrUpdated++;

      // Delay to respect Unsplash rate limits
      await delay(1000);
    }

    console.log(`✅ Seeding complete. Active crops: ${insertedOrUpdated}`);
  } catch (error) {
    console.error('❌ Error seeding crops:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
