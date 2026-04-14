import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createCommonAreaSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/maintenance/common-areas?hotelId=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "common-areas", "R");
  if (isErrorResponse(access)) return access;

  const status = req.nextUrl.searchParams.get("status");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.commonAreaCheck.findMany({
      where,
      orderBy: { checkDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.commonAreaCheck.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/maintenance/common-areas
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createCommonAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "common-areas", "W");
  if (isErrorResponse(access)) return access;

  const { checkDate, ...rest } = parsed.data;
  const record = await prisma.commonAreaCheck.create({
    data: { ...rest, checkDate: new Date(checkDate) },
  });

  return NextResponse.json(record, { status: 201 });
}
