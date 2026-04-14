import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createHotelAuditSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/audit?hotelId=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "hotel-audit", "R");
  if (isErrorResponse(access)) return access;

  const { page, limit, skip } = parsePagination(req);

  const [data, total] = await Promise.all([
    prisma.hotelAudit.findMany({
      where: { hotelId },
      include: { items: true },
      orderBy: { auditDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.hotelAudit.count({ where: { hotelId } }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/audit
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createHotelAuditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { hotelId, auditDate, items } = parsed.data;

  const access = await requireQualityAccess(hotelId, "hotel-audit", "W");
  if (isErrorResponse(access)) return access;

  // Calculate global score as average of item scores
  const globalScore = items.reduce((sum, i) => sum + i.score, 0) / items.length;

  const record = await prisma.hotelAudit.create({
    data: {
      hotelId,
      auditDate: new Date(auditDate),
      auditorId: access.user.id,
      globalScore,
      items: {
        create: items,
      },
    },
    include: { items: true },
  });

  return NextResponse.json(record, { status: 201 });
}
