import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createActionSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/actions?hotelId=...&status=...&category=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "actions", "R");
  if (isErrorResponse(access)) return access;

  const status = req.nextUrl.searchParams.get("status");
  const category = req.nextUrl.searchParams.get("category");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (status) where.status = status;
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.actionPlan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.actionPlan.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/actions
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "actions", "W");
  if (isErrorResponse(access)) return access;

  const record = await prisma.actionPlan.create({ data: parsed.data });
  return NextResponse.json(record, { status: 201 });
}
