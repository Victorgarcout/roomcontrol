import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import { updateSupplierSchema } from "@/lib/quality-schemas";

// PATCH /api/quality/maintenance/suppliers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supplier = await prisma.supplierMaint.findUnique({ where: { id } });
  if (!supplier) {
    return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
  }

  const access = await requireQualityAccess(supplier.hotelId, "suppliers", "W");
  if (isErrorResponse(access)) return access;

  const body = await req.json();
  const parsed = updateSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lastCheck, ...rest } = parsed.data;
  const updated = await prisma.supplierMaint.update({
    where: { id },
    data: {
      ...rest,
      ...(lastCheck !== undefined ? { lastCheck: lastCheck ? new Date(lastCheck) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}
