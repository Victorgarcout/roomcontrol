// ── TrustYou Connect API Service ─────────────────────────────────────
// Docs: https://api.trustyou.com/

const BASE_URL = "https://api.trustyou.com";

interface TrustYouMetrics {
  trustScore: number | null;
  responseRate: number | null;
  reviewCount: number | null;
  topPositive: string[];
  topNegative: string[];
}

interface MonthlyPerfData {
  rps: number | undefined;
  responseRate: number | undefined;
  nbReviews: number | undefined;
  posImpact1: string | undefined;
  posImpact2: string | undefined;
  posImpact3: string | undefined;
  negImpact1: string | undefined;
  negImpact2: string | undefined;
  negImpact3: string | undefined;
}

/**
 * Fetch hotel metrics from TrustYou Connect API.
 */
export async function fetchHotelMetrics(
  trustyouHotelId: string
): Promise<TrustYouMetrics | null> {
  const apiKey = process.env.TRUSTYOU_API_KEY;
  if (!apiKey) {
    console.warn("[TrustYou] TRUSTYOU_API_KEY not configured");
    return null;
  }

  try {
    // Fetch meta-review (summary data)
    const res = await fetch(
      `${BASE_URL}/hotels/${trustyouHotelId}/meta_review.json?key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      console.error(`[TrustYou] API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const response = data?.response;

    if (!response) {
      console.error("[TrustYou] Empty response");
      return null;
    }

    // Extract trust score
    const trustScore = response.trust_score?.overall ?? null;

    // Extract response rate from summary
    const responseRate = response.response_rate ?? null;

    // Extract review count
    const reviewCount = response.reviews_count ?? null;

    // Extract sentiment categories
    const categories = response.category_list ?? [];

    const positive = categories
      .filter((c: any) => c.sentiment === "positive" || c.score >= 70)
      .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3)
      .map((c: any) => c.category_name ?? c.text ?? "");

    const negative = categories
      .filter((c: any) => c.sentiment === "negative" || c.score < 50)
      .sort((a: any, b: any) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 3)
      .map((c: any) => c.category_name ?? c.text ?? "");

    return {
      trustScore,
      responseRate,
      reviewCount,
      topPositive: positive,
      topNegative: negative,
    };
  } catch (error) {
    console.error("[TrustYou] Fetch error:", error);
    return null;
  }
}

/**
 * Map TrustYou metrics to MonthlyPerf data shape.
 */
export function mapToMonthlyPerf(metrics: TrustYouMetrics): MonthlyPerfData {
  return {
    rps: metrics.trustScore ?? undefined,
    responseRate: metrics.responseRate ?? undefined,
    nbReviews: metrics.reviewCount ?? undefined,
    posImpact1: metrics.topPositive[0] ?? undefined,
    posImpact2: metrics.topPositive[1] ?? undefined,
    posImpact3: metrics.topPositive[2] ?? undefined,
    negImpact1: metrics.topNegative[0] ?? undefined,
    negImpact2: metrics.topNegative[1] ?? undefined,
    negImpact3: metrics.topNegative[2] ?? undefined,
  };
}
