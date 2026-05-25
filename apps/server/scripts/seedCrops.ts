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

const cropsToSeed: { name: string; nameHindi: string; searchQuery: string; category: CropCategory; unit: CropUnit }[] = [
  // Vegetables
  { name: 'tomato', nameHindi: 'टमाटर', searchQuery: 'tomato', category: 'vegetable', unit: 'quintal' },
  { name: 'onion', nameHindi: 'प्याज', searchQuery: 'onion', category: 'vegetable', unit: 'quintal' },
  { name: 'potato', nameHindi: 'आलू', searchQuery: 'potato', category: 'vegetable', unit: 'quintal' },
  { name: 'garlic', nameHindi: 'लहसुन', searchQuery: 'garlic', category: 'vegetable', unit: 'quintal' },
  { name: 'cauliflower', nameHindi: 'फूलगोभी', searchQuery: 'cauliflower', category: 'vegetable', unit: 'quintal' },
  { name: 'cabbage', nameHindi: 'पत्तागोभी', searchQuery: 'cabbage', category: 'vegetable', unit: 'quintal' },
  { name: 'brinjal', nameHindi: 'बैंगन', searchQuery: 'eggplant', category: 'vegetable', unit: 'quintal' },
  { name: 'okra', nameHindi: 'भिंडी', searchQuery: 'okra', category: 'vegetable', unit: 'quintal' },
  { name: 'spinach', nameHindi: 'पालक', searchQuery: 'spinach', category: 'vegetable', unit: 'kg' },
  { name: 'peas', nameHindi: 'मटर', searchQuery: 'peas', category: 'vegetable', unit: 'quintal' },
  { name: 'bitter gourd', nameHindi: 'करेला', searchQuery: 'bitter gourd', category: 'vegetable', unit: 'quintal' },
  { name: 'bottle gourd', nameHindi: 'लौकी', searchQuery: 'bottle gourd', category: 'vegetable', unit: 'quintal' },

  // Fruits
  { name: 'mango', nameHindi: 'आम', searchQuery: 'mango', category: 'fruit', unit: 'ton' },
  { name: 'banana', nameHindi: 'केला', searchQuery: 'banana', category: 'fruit', unit: 'quintal' },
  { name: 'watermelon', nameHindi: 'तरबूज', searchQuery: 'watermelon', category: 'fruit', unit: 'quintal' },
  { name: 'grapes', nameHindi: 'अंगूर', searchQuery: 'grapes', category: 'fruit', unit: 'quintal' },
  { name: 'pomegranate', nameHindi: 'अनार', searchQuery: 'pomegranate', category: 'fruit', unit: 'quintal' },
  { name: 'guava', nameHindi: 'अमरूद', searchQuery: 'guava', category: 'fruit', unit: 'quintal' },
  { name: 'apple', nameHindi: 'सेब', searchQuery: 'apple', category: 'fruit', unit: 'quintal' },
  { name: 'orange', nameHindi: 'संतरा', searchQuery: 'orange fruit', category: 'fruit', unit: 'quintal' },
  { name: 'papaya', nameHindi: 'पपीता', searchQuery: 'papaya', category: 'fruit', unit: 'quintal' },
  { name: 'lemon', nameHindi: 'नींबू', searchQuery: 'lemon', category: 'fruit', unit: 'quintal' },

  // Flowers
  { name: 'marigold', nameHindi: 'गेंदा', searchQuery: 'marigold flower', category: 'flower', unit: 'kg' },
  { name: 'rose', nameHindi: 'गुलाब', searchQuery: 'rose flower', category: 'flower', unit: 'kg' },
  { name: 'jasmine', nameHindi: 'चमेली', searchQuery: 'jasmine flower', category: 'flower', unit: 'kg' },

  // Grains
  { name: 'wheat', nameHindi: 'गेहूं', searchQuery: 'wheat field', category: 'grain', unit: 'quintal' },
  { name: 'rice', nameHindi: 'चावल / धान', searchQuery: 'rice paddy', category: 'grain', unit: 'quintal' },
  { name: 'bajra', nameHindi: 'बाजरा', searchQuery: 'pearl millet', category: 'grain', unit: 'quintal' },
  { name: 'chickpea', nameHindi: 'चना', searchQuery: 'chickpeas', category: 'grain', unit: 'quintal' },
  { name: 'lentils', nameHindi: 'मसूर दाल', searchQuery: 'lentils', category: 'grain', unit: 'quintal' },

  // Spices
  { name: 'chilli', nameHindi: 'मिर्च', searchQuery: 'chilli pepper', category: 'spice', unit: 'quintal' },
  { name: 'turmeric', nameHindi: 'हल्दी', searchQuery: 'turmeric', category: 'spice', unit: 'quintal' },
  { name: 'ginger', nameHindi: 'अदरक', searchQuery: 'ginger root', category: 'spice', unit: 'quintal' },
  { name: 'coriander', nameHindi: 'धनिया', searchQuery: 'coriander', category: 'spice', unit: 'kg' },
  { name: 'black pepper', nameHindi: 'काली मिर्च', searchQuery: 'black pepper', category: 'spice', unit: 'kg' },

  // Other (Cash Crops/Oilseeds)
  { name: 'cotton', nameHindi: 'कपास', searchQuery: 'cotton field', category: 'other', unit: 'quintal' },
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

    // Remove unwanted crops from database
    const cropsToRemove = ['jowar', 'groundnut', 'soybean', 'sugarcane', 'cumin', 'fenugreek', 'cardamom'];
    const deleteResult = await Crop.deleteMany({ name: { $in: cropsToRemove } });
    console.log(`🗑️ Removed ${deleteResult.deletedCount} unwanted crops from the database.`);

    let insertedOrUpdated = 0;

    for (const crop of cropsToSeed) {
      console.log(`⏳ Processing ${crop.name}...`);
      
      const imageUrl = await fetchUnsplashImage(`${crop.searchQuery}`);
      const description = generateDescription(crop.name, crop.nameHindi, crop.category);
      
      const cropData = {
        ...crop,
        imageUrl,
        description
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

    console.log(`✅ Seeding complete. Inserted/Updated: ${insertedOrUpdated}`);
  } catch (error) {
    console.error('❌ Error seeding crops:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
