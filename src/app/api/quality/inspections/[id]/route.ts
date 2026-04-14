import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";

// GET /api/quality/inspections/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const inspection = await prisma.roomEquipCheck.findUnique({ where: { id } });
  if (!inspection) {
    return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(inspection.hotelId, "room-inspection", "R");
  if (isErrorResponse(access)) return access;

  return NextResponse.json(inspection);
}
