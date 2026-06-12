import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Generous limiter applied to the whole API surface.
 * Defaults: 100 requests / 15 min (configurable via env).
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
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
  message: { success: false, message: 'Too many attempts, please try again later.' },
});
