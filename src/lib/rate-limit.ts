import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

// Rate limiters for auth endpoints
const rateLimiters = {
  register: new RateLimiterMemory({
    points: 10,
    duration: 60, // 10 requests per minute
  }),
  forgotPassword: new RateLimiterMemory({
    points: 5,
    duration: 60, // 5 requests per minute
  }),
  login: new RateLimiterMemory({
    points: 20,
    duration: 60, // 20 requests per minute
  }),
};

export type RateLimitKey = keyof typeof rateLimiters;

/**
 * Apply rate limiting to a request.
 * Returns a NextResponse with 429 status if rate limit is exceeded, or null if OK.
 */
export async function rateLimit(
  key: RateLimitKey,
  identifier: string
): Promise<NextResponse | null> {
  try {
    const limiter = rateLimiters[key];
    await limiter.consume(identifier);
    return null; // OK, not rate limited
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 60;
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rateLimiters[key].points),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(retryAfter),
        },
      }
    );
  }
}

/**
 * Extract a client identifier from a request (IP or forwarded IP).
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}
