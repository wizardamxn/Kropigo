import { z } from 'zod';
import type { CropUnit } from '@kropi/schemas/enum';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

// Local literal mirroring CropUnitSchema (no runtime import of the shared package).
const CROP_UNITS = ['kg', 'quintal', 'ton'] as const satisfies readonly CropUnit[];

export const createMandiRateSchema = z.object({
  cropId: objectId,
  market: z.string().min(1, 'Market is required').max(200),
  state: z.string().min(1, 'State is required').max(100),
  minPrice: z.coerce.number().nonnegative(),
  maxPrice: z.coerce.number().nonnegative(),
  modalPrice: z.coerce.number().nonnegative().optional(),
  unit: z.enum(CROP_UNITS),
  date: z.coerce.date().optional(),
});
