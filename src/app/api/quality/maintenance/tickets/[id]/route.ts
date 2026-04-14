import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateTicketSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/maintenance/tickets/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(ticket.hotelId, "maintenance-tickets", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.maintenanceTicket.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
