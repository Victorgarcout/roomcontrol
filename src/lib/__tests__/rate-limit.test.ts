import { describe, it, expect } from "vitest";
import { rateLimit, getClientIdentifier } from "../rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", async () => {
    const result = await rateLimit("register", "test-ip-1");
    expect(result).toBeNull();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const ip = "test-ip-exceeded-" + Date.now();
    // Register allows 10 requests per minute
    for (let i = 0; i < 10; i++) {
      const res = await rateLimit("register", ip);
      expect(res).toBeNull();
    }

    // 11th request should be rate limited
    const res = await rateLimit("register", ip);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);

    const body = await res!.json();
    expect(body.error).toContain("Trop de requêtes");
  });

  it("uses different limits for different keys", async () => {
    const ip = "test-ip-forgot-" + Date.now();
    // forgotPassword allows only 5 requests per minute
    for (let i = 0; i < 5; i++) {
      const res = await rateLimit("forgotPassword", ip);
      expect(res).toBeNull();
    }

    // 6th request should be blocked
    const res = await rateLimit("forgotPassword", ip);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it("includes Retry-After header in 429 response", async () => {
    const ip = "test-ip-headers-" + Date.now();
    for (let i = 0; i < 10; i++) {
      await rateLimit("register", ip);
    }
    const res = await rateLimit("register", ip);
    expect(res).not.toBeNull();
    expect(res!.headers.get("Retry-After")).toBeDefined();
    expect(res!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});

describe("getClientIdentifier", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const req = {
      headers: new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
    } as any;
    expect(getClientIdentifier(req)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no forwarded header", () => {
    const req = { headers: new Headers() } as any;
    expect(getClientIdentifier(req)).toBe("unknown");
  });
});
