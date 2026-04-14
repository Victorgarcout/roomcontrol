import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateCommissionSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/safety/commissions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commission = await prisma.safetyCommission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ error: "Commission introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(commission.hotelId, "safety", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateCommissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { visitDate, nextVisitDate, ...rest } = parsed.data as any;
  const updated = await prisma.safetyCommission.update({
    where: { id },
    data: {
      ...rest,
      ...(nextVisitDate !== undefined
        ? { nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null }
        : {}),
    },
  });

  return NextResponse.json(updated);
}
