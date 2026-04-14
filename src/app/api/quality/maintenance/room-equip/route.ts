import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createRoomEquipSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/maintenance/room-equip?hotelId=...&roomNumber=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "room-equip", "R");
  if (isErrorResponse(access)) return access;

  const roomNumber = req.nextUrl.searchParams.get("roomNumber");
  const status = req.nextUrl.searchParams.get("status");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (roomNumber) where.roomNumber = roomNumber;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.roomEquipCheck.findMany({
      where,
      orderBy: { checkDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.roomEquipCheck.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/maintenance/room-equip
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createRoomEquipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "room-equip", "W");
  if (isErrorResponse(access)) return access;

  const { checkDate, ...rest } = parsed.data;
  const record = await prisma.roomEquipCheck.create({
    data: { ...rest, checkDate: new Date(checkDate) },
  });

  return NextResponse.json(record, { status: 201 });
}
