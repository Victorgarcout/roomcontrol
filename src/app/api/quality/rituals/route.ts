import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { toggleRitualSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/rituals?hotelId=...&weekStart=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "rituals", "R");
  if (isErrorResponse(access)) return access;

  const weekStart = req.nextUrl.searchParams.get("weekStart");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (weekStart) where.weekStart = new Date(weekStart);

  const [data, total] = await Promise.all([
    prisma.ritualCheck.findMany({
      where,
      orderBy: { weekStart: "desc" },
      skip,
      take: limit,
    }),
    prisma.ritualCheck.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/rituals — toggle a ritual check
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = toggleRitualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { hotelId, ritualId, weekStart, done } = parsed.data;

  const access = await requireQualityAccess(hotelId, "rituals", "W");
  if (isErrorResponse(access)) return access;

  const record = await prisma.ritualCheck.upsert({
    where: {
      hotelId_ritualId_weekStart: {
        hotelId,
        ritualId,
        weekStart: new Date(weekStart),
      },
    },
    update: { done },
    create: {
      hotelId,
      ritualId,
      userId: access.user.id,
      weekStart: new Date(weekStart),
      done,
    },
  });

  return NextResponse.json(record, { status: 200 });
}
