import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createPlaybookSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/playbook?hotelId=...&type=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "playbook", "R");
  if (isErrorResponse(access)) return access;

  const type = req.nextUrl.searchParams.get("type");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prisma.playbookCustom.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.playbookCustom.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/playbook
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createPlaybookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "playbook", "W");
  if (isErrorResponse(access)) return access;

  const record = await prisma.playbookCustom.create({
    data: {
      ...parsed.data,
      createdBy: access.user.id,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
