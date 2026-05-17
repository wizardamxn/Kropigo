import { z } from 'zod'
import dotenv from "dotenv"
dotenv.config()

const envSchema = z.object({
    // Runtime
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z
        .string()
        .default('5000')
        .transform((v) => parseInt(v, 10)),
    BYPASS_TIME_WINDOW: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),

    // Database
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // JWT
    JWT_SECRET: z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_COOKIE_EXPIRY_DAYS: z
        .string()
        .default('7')
        .transform((v) => parseInt(v, 10)),

    // CORS
    CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL').transform(url => url.replace(/\/$/, '')),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
    CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
    CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z
        .string()
        .default('900000')
        .transform((v) => parseInt(v, 10)),
    RATE_LIMIT_MAX: z
        .string()
        .default('100')
        .transform((v) => parseInt(v, 10)),

    // MSG91
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
});



const _parsed = envSchema.safeParse(process.env)




if (!_parsed.success) {
    console.error('❌  Invalid / missing environment variables:\n');
    const fieldErrors = _parsed.error.flatten().fieldErrors;
    Object.entries(fieldErrors).forEach(([key, messages]) => {
        console.error(`   ${key}: ${messages?.join(', ')}`);
    });
    console.error('\nFix the above variables in your .env file and restart.\n');
    process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env 