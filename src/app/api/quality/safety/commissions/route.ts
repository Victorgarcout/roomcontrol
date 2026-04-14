import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createCommissionSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/safety/commissions?hotelId=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "safety", "R");
  if (isErrorResponse(access)) return access;

  const { page, limit, skip } = parsePagination(req);

  const [data, total] = await Promise.all([
    prisma.safetyCommission.findMany({
      where: { hotelId },
      orderBy: { visitDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.safetyCommission.count({ where: { hotelId } }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/safety/commissions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createCommissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "safety", "W");
  if (isErrorResponse(access)) return access;

  const { visitDate, nextVisitDate, ...rest } = parsed.data;
  const record = await prisma.safetyCommission.create({
    data: {
      ...rest,
      visitDate: new Date(visitDate),
      ...(nextVisitDate ? { nextVisitDate: new Date(nextVisitDate) } : {}),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
