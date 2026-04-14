import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateRoomEquipSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/maintenance/room-equip/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await prisma.roomEquipCheck.findUnique({ where: { id } });
  if (!check) {
    return NextResponse.json({ error: "Contrôle introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(check.hotelId, "room-equip", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateRoomEquipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.roomEquipCheck.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
