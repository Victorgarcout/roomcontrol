import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalRooms,
    statusCounts,
    todayArrivals,
    todayDepartures,
    todayBookings,
    weekBookings,
    monthBookings,
    weeklyOccupancy,
  ] = await Promise.all([
    prisma.room.count({ where: { hotelId } }),
    prisma.room.groupBy({
      by: ["status"],
      where: { hotelId },
      _count: true,
    }),
    prisma.booking.count({
      where: { hotelId, checkIn: { gte: today, lt: tomorrow }, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    }),
    prisma.booking.count({
      where: { hotelId, checkOut: { gte: today, lt: tomorrow }, status: { in: ["CHECKED_IN", "CHECKED_OUT"] } },
    }),
    prisma.booking.aggregate({
      where: { hotelId, createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { hotelId, createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { hotelId, createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    // Get daily occupancy for the last 7 days
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        return prisma.booking.count({
          where: {
            hotelId,
            checkIn: { lte: nextDate },
            checkOut: { gte: date },
            status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          },
        }).then((count) => ({
          date: date.toISOString().split("T")[0],
          day: date.toLocaleDateString("fr-FR", { weekday: "short" }),
          occupied: count,
        }));
      })
    ),
  ]);

  const statusMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  );

  const available = statusMap.AVAILABLE || 0;
  const occupied = statusMap.OCCUPIED || 0;
  const maintenance = statusMap.MAINTENANCE || 0;
  const cleaning = statusMap.CLEANING || 0;
  const blocked = statusMap.BLOCKED || 0;

  return NextResponse.json({
    totalRooms,
    available,
    occupied,
    maintenance,
    cleaning,
    blocked,
    occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    todayArrivals,
    todayDepartures,
    todayRevenue: todayBookings._sum.totalAmount || 0,
    weekRevenue: weekBookings._sum.totalAmount || 0,
    monthRevenue: monthBookings._sum.totalAmount || 0,
    weeklyOccupancy: weeklyOccupancy.map((d) => ({
      ...d,
      rate: totalRooms > 0 ? Math.round((d.occupied / totalRooms) * 100) : 0,
    })),
  });
}
