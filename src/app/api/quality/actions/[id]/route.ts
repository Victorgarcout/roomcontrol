import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateActionSchema } from "@/lib/quality-schemas";

// GET /api/quality/actions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = await prisma.actionPlan.findUnique({ where: { id } });
  if (!action) {
    return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(action.hotelId, "actions", "R");
  if (isErrorResponse(access)) return access;

  return NextResponse.json(action);
}

// PATCH /api/quality/actions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = await prisma.actionPlan.findUnique({ where: { id } });
  if (!action) {
    return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(action.hotelId, "actions", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // RW_LIMITED: OPE_HEBERGEMENT can only update status
  if (access.accessLevel === "RW_LIMITED") {
    const allowedKeys = ["status"];
    const keys = Object.keys(parsed.data);
    if (keys.some((k) => !allowedKeys.includes(k))) {
      return NextResponse.json(
        { error: "Accès limité : seul le statut peut être modifié" },
        { status: 403 }
      );
    }
  }

  const updated = await prisma.actionPlan.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/quality/actions/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = await prisma.actionPlan.findUnique({ where: { id } });
  if (!action) {
    return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(action.hotelId, "actions", "W");
  if (isErrorResponse(access)) return access;

  // Only full RW can delete
  if (access.accessLevel !== "RW") {
    return NextResponse.json({ error: "Suppression non autorisée" }, { status: 403 });
  }

  await prisma.actionPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
