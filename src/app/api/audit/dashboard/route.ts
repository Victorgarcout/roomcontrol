import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/dashboard - Audit dashboard stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all audits for this hotel in the last 30 days
    const recentAudits = await prisma.roomAudit.findMany({
      where: {
        room: { hotelId },
        startedAt: { gte: thirtyDaysAgo },
      },
      include: {
        room: { select: { id: true, number: true, floor: true } },
        results: {
          include: {
            checkpoint: {
              include: {
                zone: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Average conformity rate per room
    const roomStats: Record<string, { number: string; floor: number; totalScore: number; count: number }> = {};
    for (const audit of recentAudits) {
      const key = audit.roomId;
      if (!roomStats[key]) {
        roomStats[key] = { number: audit.room.number, floor: audit.room.floor, totalScore: 0, count: 0 };
      }
      roomStats[key].totalScore += audit.score ?? 0;
      roomStats[key].count += 1;
    }

    const roomAverages = Object.entries(roomStats).map(([roomId, data]) => ({
      roomId,
      roomNumber: data.number,
      floor: data.floor,
      averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
      auditCount: data.count,
    })).sort((a, b) => a.averageScore - b.averageScore);

    // Average conformity per floor
    const floorStats: Record<number, { totalScore: number; count: number }> = {};
    for (const audit of recentAudits) {
      const floor = audit.room.floor;
      if (!floorStats[floor]) {
        floorStats[floor] = { totalScore: 0, count: 0 };
      }
      floorStats[floor].totalScore += audit.score ?? 0;
      floorStats[floor].count += 1;
    }

    const floorAverages = Object.entries(floorStats).map(([floor, data]) => ({
      floor: parseInt(floor),
      averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
      auditCount: data.count,
    })).sort((a, b) => a.floor - b.floor);

    // Top failing checkpoints
    const checkpointFails: Record<string, { label: string; zoneName: string; failCount: number; totalCount: number }> = {};
    for (const audit of recentAudits) {
      for (const result of audit.results) {
        const key = result.checkpointId;
        if (!checkpointFails[key]) {
          checkpointFails[key] = {
            label: result.checkpoint.label,
            zoneName: result.checkpoint.zone.name,
            failCount: 0,
            totalCount: 0,
          };
        }
        checkpointFails[key].totalCount += 1;
        if (result.passed === false) {
          checkpointFails[key].failCount += 1;
        }
      }
    }

    const topFailing = Object.entries(checkpointFails)
      .map(([id, data]) => ({
        checkpointId: id,
        ...data,
        failRate: Math.round((data.failCount / data.totalCount) * 100 * 100) / 100,
      }))
      .filter((cp) => cp.failCount > 0)
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 10);

    // Quality trend over 30 days (grouped by day)
    const dailyTrend: Record<string, { totalScore: number; count: number }> = {};
    for (const audit of recentAudits) {
      const day = audit.startedAt.toISOString().slice(0, 10);
      if (!dailyTrend[day]) {
        dailyTrend[day] = { totalScore: 0, count: 0 };
      }
      dailyTrend[day].totalScore += audit.score ?? 0;
      dailyTrend[day].count += 1;
    }

    const trend = Object.entries(dailyTrend)
      .map(([date, data]) => ({
        date,
        averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
        auditCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Summary
    const totalAudits = recentAudits.length;
    const passedAudits = recentAudits.filter((a) => a.passed).length;
    const avgScore = totalAudits > 0
      ? Math.round(recentAudits.reduce((sum, a) => sum + (a.score ?? 0), 0) / totalAudits * 100) / 100
      : 0;

    return NextResponse.json({
      summary: {
        totalAudits,
        passedAudits,
        failedAudits: totalAudits - passedAudits,
        passRate: totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100 * 100) / 100 : 0,
        averageScore: avgScore,
      },
      roomAverages,
      floorAverages,
      topFailing,
      trend,
    });
  } catch (error) {
    console.error("[AUDIT_DASHBOARD_GET]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
