import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateCommonAreaSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/maintenance/common-areas/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await prisma.commonAreaCheck.findUnique({ where: { id } });
  if (!check) {
    return NextResponse.json({ error: "Contrôle introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(check.hotelId, "common-areas", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateCommonAreaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.commonAreaCheck.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
