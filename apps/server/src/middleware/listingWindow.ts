import { Request, Response, NextFunction } from 'express';
import { isInWindow } from '../utils/istTime';
import { env } from '../config/env';

/**
 * Middleware to restrict listing creation strictly between 10 AM and 5 PM IST.
 * This is applied to POST /listings.
 */
export const listingWindow = (req: Request, res: Response, next: NextFunction): void => {
  // Only restrict POST requests
  if (req.method !== 'POST') {
    return next();
  }

  // Bypass for local development / testing if explicitly enabled
  if (env.BYPASS_TIME_WINDOW) {
    return next();
  }

  // Window is 10:00 to 17:00 (exclusive of 17:00)
  const isAllowed = isInWindow(0o0, 24);

  if (!isAllowed) {
    res.status(403).json({
      success: false,
      message: 'Listings can only be created between 10 AM and 5 PM IST',
    });
    return;
  }

  next();
};
