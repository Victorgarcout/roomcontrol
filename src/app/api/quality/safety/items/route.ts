import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createSafetyItemSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/safety/items?hotelId=...&category=...&status=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "safety", "R");
  if (isErrorResponse(access)) return access;

  const category = req.nextUrl.searchParams.get("category");
  const status = req.nextUrl.searchParams.get("status");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (category) where.category = category;
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.safetyItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.safetyItem.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/safety/items
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSafetyItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "safety", "W");
  if (isErrorResponse(access)) return access;

  const { lastCheck, ...rest } = parsed.data;
  const record = await prisma.safetyItem.create({
    data: {
      ...rest,
      ...(lastCheck ? { lastCheck: new Date(lastCheck) } : {}),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
