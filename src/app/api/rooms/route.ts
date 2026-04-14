import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const categoryId = req.nextUrl.searchParams.get("categoryId");
  const floor = req.nextUrl.searchParams.get("floor");

  const where: any = { hotelId };
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (floor) where.floor = parseInt(floor);

  const pagination = parsePagination(req);
  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, price: true, capacity: true } },
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkIn: { lte: new Date() },
            checkOut: { gte: new Date() },
          },
          include: { guest: { select: { firstName: true, lastName: true } } },
          take: 1,
        },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.room.count({ where }),
  ]);

  const result = rooms.map((room) => ({
    ...room,
    currentBooking: room.bookings[0] || null,
    bookings: undefined,
  }));

  return NextResponse.json(paginatedResponse(result, total, pagination));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { hotelId, rooms } = body;

    if (!hotelId || !rooms?.length) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const created = await prisma.room.createMany({
      data: rooms.map((r: any) => ({
        hotelId,
        categoryId: r.categoryId,
        number: r.number,
        floor: r.floor || 1,
        notes: r.notes,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error: any) {
    console.error("[ROOMS_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { roomId, status, notes } = await req.json();
    const userId = (session.user as any).id;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 });
    }

    const [updatedRoom] = await prisma.$transaction([
      prisma.room.update({
        where: { id: roomId },
        data: { status, notes },
      }),
      prisma.statusHistory.create({
        data: {
          roomId,
          fromStatus: room.status,
          toStatus: status,
          changedBy: userId,
          notes,
        },
      }),
    ]);

    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    console.error("[ROOMS_PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
