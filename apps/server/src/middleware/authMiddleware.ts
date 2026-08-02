import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UserRole } from '@kropi/schemas/enum';

interface JwtPayload {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Browsers authenticate with the existing httpOnly cookie. Native clients
    // cannot use that flow reliably, so they send the same JWT as a Bearer
    // token. Keeping the cookie first preserves web behaviour.
    const authorization = req.get('authorization');
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      throw new ApiError(401, 'Not authenticated. Please log in.');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired session. Please log in again.');
    }
  }
);

export const requireRole = (role: UserRole): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      throw new ApiError(403, `Access denied. Requires ${role} role.`);
    }
    next();
  };
};
