import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Parse pagination params from a NextRequest's search params.
 */
export function parsePagination(req: NextRequest): PaginationParams {
  const pageParam = req.nextUrl.searchParams.get("page");
  const limitParam = req.nextUrl.searchParams.get("limit");

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build a paginated response object.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
