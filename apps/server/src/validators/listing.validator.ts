import { z } from 'zod';
import type { CropUnit } from '@kropi/schemas/enum';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Local literal mirroring CropUnitSchema (no runtime import of the shared package).
const CROP_UNITS = ['kg', 'quintal', 'ton'] as const satisfies readonly CropUnit[];
const cropUnitEnum = z.enum(CROP_UNITS);

export const createListingSchema = z.object({
  cropId: objectId,
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  variety: z.string().max(100).optional(),
  unit: cropUnitEnum,
  description: z.string().max(2000).optional(),
  mediaUrls: z.array(z.string().url()).max(6, 'Maximum 6 media files allowed').optional().default([]),
  farmAddress: z.string().max(500).optional(),
  farmState: z.string().max(100).optional(),
  farmDistrict: z.string().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const updateListingSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  variety: z.string().max(100).optional(),
  unit: cropUnitEnum.optional(),
  description: z.string().max(2000).optional(),
  farmAddress: z.string().max(500).optional(),
  farmState: z.string().max(100).optional(),
  farmDistrict: z.string().max(100).optional(),
  status: z.enum(['draft', 'open']).optional(),
  mediaUrls: z.array(z.string().url()).max(6).optional().default([]),
  deletedMediaUrls: z.array(z.string().url()).optional().default([]),
});

export const submitInterestSchema = z.object({
  price: z.coerce.number().positive('A valid offered price is required'),
  quantity: z.coerce.number().positive().optional(),
  notes: z.string().max(500).optional(),
});
