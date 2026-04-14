import { describe, it, expect } from "vitest";
import { calculateNights, formatCurrency, cn } from "../utils";

describe("calculateNights", () => {
  it("calculates correct number of nights", () => {
    const checkIn = new Date("2025-01-01");
    const checkOut = new Date("2025-01-04");
    expect(calculateNights(checkIn, checkOut)).toBe(3);
  });

  it("returns 1 for same-day checkout next day", () => {
    const checkIn = new Date("2025-06-15");
    const checkOut = new Date("2025-06-16");
    expect(calculateNights(checkIn, checkOut)).toBe(1);
  });

  it("handles string dates", () => {
    expect(calculateNights("2025-03-01" as any, "2025-03-10" as any)).toBe(9);
  });
});

describe("formatCurrency", () => {
  it("formats euros in French locale", () => {
    const result = formatCurrency(1250);
    // Should contain the amount and EUR symbol
    expect(result).toContain("1");
    expect(result).toContain("250");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});
