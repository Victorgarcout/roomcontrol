import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateSafetyItemSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/safety/items/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.safetyItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(item.hotelId, "safety", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateSafetyItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lastCheck, ...rest } = parsed.data;
  const updated = await prisma.safetyItem.update({
    where: { id },
    data: {
      ...rest,
      ...(lastCheck !== undefined ? { lastCheck: lastCheck ? new Date(lastCheck) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}
