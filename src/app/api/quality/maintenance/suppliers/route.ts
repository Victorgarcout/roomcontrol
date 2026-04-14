import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createSupplierSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/maintenance/suppliers?hotelId=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "suppliers", "R");
  if (isErrorResponse(access)) return access;

  const { page, limit, skip } = parsePagination(req);

  const where = { hotelId };

  const [data, total] = await Promise.all([
    prisma.supplierMaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.supplierMaint.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/maintenance/suppliers
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "suppliers", "W");
  if (isErrorResponse(access)) return access;

  const { lastCheck, ...rest } = parsed.data;
  const record = await prisma.supplierMaint.create({
    data: {
      ...rest,
      ...(lastCheck ? { lastCheck: new Date(lastCheck) } : {}),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
