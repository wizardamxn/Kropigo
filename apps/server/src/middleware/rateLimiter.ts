import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Rate limiting only matters in production. In dev/test the SPA fires many
// RTK Query requests per page and repeated login attempts while testing, which
// trips the limiter constantly — so skip it entirely outside production.
const skipOutsideProduction = () => env.NODE_ENV !== 'production';

/**
 * Generous limiter applied to the whole API surface.
 * Defaults: 1000 requests / 15 min (configurable via env).
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipOutsideProduction,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * Strict limiter for credential endpoints (login/register) to slow brute force.
 * 10 attempts / 15 min per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: skipOutsideProduction,
  message: { success: false, message: 'Too many attempts, please try again later.' },
});
