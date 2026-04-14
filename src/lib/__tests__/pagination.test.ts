import { describe, it, expect } from "vitest";
import { parsePagination, paginatedResponse } from "../pagination";

// Helper to create a mock NextRequest
function mockRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/test");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return { nextUrl: url } as any;
}

describe("parsePagination", () => {
  it("returns defaults when no params provided", () => {
    const result = parsePagination(mockRequest());
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("parses page and limit from search params", () => {
    const result = parsePagination(mockRequest({ page: "3", limit: "10" }));
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("clamps limit to max 100", () => {
    const result = parsePagination(mockRequest({ limit: "500" }));
    expect(result.limit).toBe(100);
  });

  it("clamps page to min 1", () => {
    const result = parsePagination(mockRequest({ page: "-5" }));
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it("handles non-numeric values gracefully", () => {
    const result = parsePagination(mockRequest({ page: "abc", limit: "xyz" }));
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("calculates skip correctly for page 2", () => {
    const result = parsePagination(mockRequest({ page: "2", limit: "15" }));
    expect(result.skip).toBe(15);
  });
});

describe("paginatedResponse", () => {
  it("builds correct response shape", () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = paginatedResponse(data, 50, { page: 1, limit: 20, skip: 0 });

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      },
    });
  });

  it("calculates totalPages correctly with exact division", () => {
    const result = paginatedResponse([], 40, { page: 1, limit: 20, skip: 0 });
    expect(result.meta.totalPages).toBe(2);
  });

  it("calculates totalPages correctly with remainder", () => {
    const result = paginatedResponse([], 41, { page: 1, limit: 20, skip: 0 });
    expect(result.meta.totalPages).toBe(3);
  });

  it("handles zero total", () => {
    const result = paginatedResponse([], 0, { page: 1, limit: 20, skip: 0 });
    expect(result.meta.totalPages).toBe(0);
  });
});
