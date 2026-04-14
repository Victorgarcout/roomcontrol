import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";

// GET /api/quality/hub?hotelId=...
// Dashboard aggregation endpoint — returns KPIs across all quality modules
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "hub", "R");
  if (isErrorResponse(access)) return access;

  // Get current month/year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Run all aggregation queries in parallel
  const [
    hotel,
    latestPerf,
    actionStats,
    ticketStats,
    safetyExpired,
    roomEquipPending,
    commonAreaPending,
    latestAudit,
    ritualStats,
  ] = await Promise.all([
    // Hotel info
    prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { name: true, city: true, rooms_count: true, rpsTarget: true },
    }),

    // Latest monthly performance
    prisma.monthlyPerf.findFirst({
      where: { hotelId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),

    // Action plan stats
    prisma.actionPlan.groupBy({
      by: ["status"],
      where: { hotelId },
      _count: true,
    }),

    // Maintenance ticket stats
    prisma.maintenanceTicket.groupBy({
      by: ["status"],
      where: { hotelId },
      _count: true,
    }),

    // Safety items expired or in reserve
    prisma.safetyItem.count({
      where: {
        hotelId,
        status: { in: ["EXPIRE", "RESERVE"] },
      },
    }),

    // Room equipment checks pending
    prisma.roomEquipCheck.count({
      where: {
        hotelId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),

    // Common area checks pending
    prisma.commonAreaCheck.count({
      where: {
        hotelId,
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
    }),

    // Latest audit score
    prisma.hotelAudit.findFirst({
      where: { hotelId },
      orderBy: { auditDate: "desc" },
      select: { auditDate: true, globalScore: true },
    }),

    // Ritual completion for current week
    prisma.ritualCheck.count({
      where: {
        hotelId,
        done: true,
        weekStart: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
        },
      },
    }),
  ]);

  // Transform action stats
  const actions = {
    todo: 0,
    inProgress: 0,
    done: 0,
  };
  for (const s of actionStats) {
    if (s.status === "TODO") actions.todo = s._count;
    if (s.status === "IN_PROGRESS") actions.inProgress = s._count;
    if (s.status === "DONE") actions.done = s._count;
  }

  // Transform ticket stats
  const tickets = {
    aFaire: 0,
    enCours: 0,
    termine: 0,
  };
  for (const s of ticketStats) {
    if (s.status === "A_FAIRE") tickets.aFaire = s._count;
    if (s.status === "EN_COURS") tickets.enCours = s._count;
    if (s.status === "TERMINE") tickets.termine = s._count;
  }

  return NextResponse.json({
    hotel,
    performance: latestPerf
      ? {
          rps: latestPerf.rps,
          rpsN1: latestPerf.rpsN1,
          compIndex: latestPerf.compIndex,
          nbReviews: latestPerf.nbReviews,
          responseRate: latestPerf.responseRate,
          month: latestPerf.month,
          year: latestPerf.year,
        }
      : null,
    actions,
    tickets,
    safety: {
      alertCount: safetyExpired,
    },
    maintenance: {
      roomEquipPending,
      commonAreaPending,
    },
    audit: latestAudit
      ? {
          lastDate: latestAudit.auditDate,
          globalScore: latestAudit.globalScore,
        }
      : null,
    rituals: {
      completedThisWeek: ritualStats,
    },
  });
}
