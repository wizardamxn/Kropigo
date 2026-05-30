import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/**
 * Zod validation middleware.
 * Parses req.body against the provided schema.
 * Returns 400 with validation errors if parsing fails.
 */
export const validate = (schema: ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Zod v4: .issues replaces .errors; path is PropertyKey[] so use .toString()
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.map((p) => p.toString()).join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Validation failed',
        errors,
      });
      return;
    }

    // Replace req.body with the parsed (and type-coerced) data
    req.body = result.data;
    next();
  };
};
