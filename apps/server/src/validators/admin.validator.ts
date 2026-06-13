import { z } from 'zod';

export const setVerificationSchema = z.object({
  isVerified: z.boolean(),
});
