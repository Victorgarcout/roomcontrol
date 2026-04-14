import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";

// GET /api/quality/audit/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = await prisma.hotelAudit.findUnique({
    where: { id },
    include: { items: true, auditor: { select: { name: true, email: true } } },
  });
  if (!audit) {
    return NextResponse.json({ error: "Audit introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(audit.hotelId, "hotel-audit", "R");
  if (isErrorResponse(access)) return access;

  return NextResponse.json(audit);
}
