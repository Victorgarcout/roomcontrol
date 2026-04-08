import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "week":
      start.setDate(now.getDate() - now.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "quarter":
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  const type = req.nextUrl.searchParams.get("type") || "occupation";
  const period = req.nextUrl.searchParams.get("period") || "month";

  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const { start, end } = getPeriodDates(period);

  if (type === "occupation") {
    const totalRooms = await prisma.room.count({ where: { hotelId } });
    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        checkIn: { lte: end },
        checkOut: { gte: start },
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      },
      select: { checkIn: true, checkOut: true, nights: true },
    });

    const totalNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalRoomNights = totalRooms * totalNights;
    const occupiedNights = bookings.reduce((sum, b) => sum + b.nights, 0);
    const occupancyRate = totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0;

    // Chart: daily or weekly breakdown
    const chart = [];
    const step = totalNights > 31 ? 7 : 1;
    for (let i = 0; i < totalNights; i += step) {
      const dayStart = new Date(start);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + step);

      const count = bookings.filter(
        (b) => new Date(b.checkIn) <= dayEnd && new Date(b.checkOut) >= dayStart
      ).length;

      chart.push({
        label: dayStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        rate: totalRooms > 0 ? Math.round((count / totalRooms) * 100) : 0,
      });
    }

    return NextResponse.json({
      chart,
      rows: chart,
      summary: {
        "Taux d'occupation moyen": `${occupancyRate}%`,
        "Nuitees vendues": occupiedNights,
        "Nuitees disponibles": totalRoomNights,
        "Reservations": bookings.length,
      },
    });
  }

  if (type === "revenue") {
    const categories = await prisma.roomCategory.findMany({
      where: { hotelId },
      include: {
        rooms: {
          include: {
            bookings: {
              where: {
                createdAt: { gte: start, lte: end },
                status: { not: "CANCELLED" },
              },
              select: { totalAmount: true },
            },
          },
        },
      },
    });

    const chart = categories.map((cat) => ({
      name: cat.name,
      value: cat.rooms.reduce(
        (sum, room) => sum + room.bookings.reduce((s, b) => s + b.totalAmount, 0),
        0
      ),
    }));

    const totalRevenue = chart.reduce((sum, c) => sum + c.value, 0);

    return NextResponse.json({
      chart,
      rows: chart,
      summary: {
        "Revenu total": `${totalRevenue.toFixed(2)} EUR`,
        "Nombre de categories": categories.length,
        "Categorie top": chart.sort((a, b) => b.value - a.value)[0]?.name || "-",
      },
    });
  }

  return NextResponse.json({ chart: [], rows: [], summary: {} });
}
