import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";

// DELETE /api/quality/playbook/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playbook = await prisma.playbookCustom.findUnique({ where: { id } });
  if (!playbook) {
    return NextResponse.json({ error: "Playbook introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(playbook.hotelId, "playbook", "W");
  if (isErrorResponse(access)) return access;

  await prisma.playbookCustom.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
