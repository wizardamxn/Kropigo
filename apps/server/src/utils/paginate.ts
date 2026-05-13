import { Request } from 'express';

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Extracts pagination parameters from the Request query.
 * @param req Express Request object
 * @param defaultLimit Fallback limit if not provided in query
 * @returns Object containing parsed page, limit, and skip values
 */
export const getPaginationOptions = (req: Request, defaultLimit = 10) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || defaultLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Formats a paginated database result into a standardized response payload.
 */
export const createPaginatedResponse = <T>(
  docs: T[],
  totalDocs: number,
  page: number,
  limit: number
): PaginatedResult<T> => {
  const totalPages = Math.ceil(totalDocs / limit);
  return {
    docs,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
