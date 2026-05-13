import { Request, Response, NextFunction } from 'express';

// Defines the signature for an async Express controller
type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async Express route handler so that any rejected promises
 * are automatically caught and passed to the next() error handler middleware.
 */
export const asyncHandler = (requestHandler: AsyncController) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
