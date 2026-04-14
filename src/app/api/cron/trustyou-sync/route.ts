import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchHotelMetrics, mapToMonthlyPerf } from "@/lib/trustyou";

/**
 * Vercel Cron: Weekly TrustYou sync
 * Schedule: every Monday at 6:00 AM (0 6 * * 1)
 * Protected by CRON_SECRET
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Get all hotels with TrustYou ID configured
  const hotels = await prisma.hotel.findMany({
    where: { trustyouId: { not: null } },
    select: { id: true, name: true, trustyouId: true },
  });

  console.log(`[TrustYou Sync] Starting sync for ${hotels.length} hotels`);

  const results: { hotelId: string; name: string; status: string }[] = [];

  for (const hotel of hotels) {
    try {
      const metrics = await fetchHotelMetrics(hotel.trustyouId!);

      if (!metrics) {
        results.push({ hotelId: hotel.id, name: hotel.name, status: "no_data" });
        continue;
      }

      const perfData = mapToMonthlyPerf(metrics);

      await prisma.monthlyPerf.upsert({
        where: {
          hotelId_year_month: { hotelId: hotel.id, year, month },
        },
        update: perfData,
        create: {
          hotelId: hotel.id,
          year,
          month,
          ...perfData,
        },
      });

      results.push({ hotelId: hotel.id, name: hotel.name, status: "synced" });
      console.log(`[TrustYou Sync] ${hotel.name}: RPS=${metrics.trustScore}, Reviews=${metrics.reviewCount}`);
    } catch (error) {
      console.error(`[TrustYou Sync] Error for ${hotel.name}:`, error);
      results.push({ hotelId: hotel.id, name: hotel.name, status: "error" });
    }
  }

  console.log(`[TrustYou Sync] Complete: ${results.filter((r) => r.status === "synced").length}/${hotels.length} synced`);

  return NextResponse.json({
    synced: results.filter((r) => r.status === "synced").length,
    errors: results.filter((r) => r.status === "error").length,
    noData: results.filter((r) => r.status === "no_data").length,
    details: results,
  });
}
