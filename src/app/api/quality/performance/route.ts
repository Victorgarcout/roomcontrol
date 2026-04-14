import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { upsertPerformanceSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/performance?hotelId=...&year=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "performance", "R");
  if (isErrorResponse(access)) return access;

  const year = req.nextUrl.searchParams.get("year");
  const { page, limit, skip } = parsePagination(req);

  const where = {
    hotelId,
    ...(year ? { year: parseInt(year, 10) } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.monthlyPerf.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      skip,
      take: limit,
    }),
    prisma.monthlyPerf.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/performance — upsert monthly performance
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = upsertPerformanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { hotelId, year, month, ...rest } = parsed.data;

  const access = await requireQualityAccess(hotelId, "performance", "W");
  if (isErrorResponse(access)) return access;

  const record = await prisma.monthlyPerf.upsert({
    where: { hotelId_year_month: { hotelId, year, month } },
    update: rest,
    create: { hotelId, year, month, ...rest },
  });

  return NextResponse.json(record, { status: 200 });
}
