import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { createTicketSchema } from "@/lib/quality-schemas";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/quality/maintenance/tickets?hotelId=...&status=...&priority=...
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const access = await requireQualityAccess(hotelId, "maintenance-tickets", "R");
  if (isErrorResponse(access)) return access;

  const status = req.nextUrl.searchParams.get("status");
  const priority = req.nextUrl.searchParams.get("priority");
  const { page, limit, skip } = parsePagination(req);

  const where: any = { hotelId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [data, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, { page, limit, skip }));
}

// POST /api/quality/maintenance/tickets
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const access = await requireQualityAccess(parsed.data.hotelId, "maintenance-tickets", "W");
  if (isErrorResponse(access)) return access;

  const record = await prisma.maintenanceTicket.create({ data: parsed.data });
  return NextResponse.json(record, { status: 201 });
}
