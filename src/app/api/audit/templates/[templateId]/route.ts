import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/templates/[templateId]
export async function GET(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const template = await prisma.auditTemplate.findUnique({
      where: { id: params.templateId },
      include: {
        zones: {
          orderBy: { sortOrder: "asc" },
          include: {
            checkpoints: { orderBy: { sortOrder: "asc" } },
          },
        },
        _count: { select: { audits: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[AUDIT_TEMPLATE_GET]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// PATCH /api/audit/templates/[templateId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, scoringMode, isActive } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (scoringMode !== undefined) data.scoringMode = scoringMode;
    if (isActive !== undefined) data.isActive = isActive;

    const template = await prisma.auditTemplate.update({
      where: { id: params.templateId },
      data,
      include: {
        zones: {
          orderBy: { sortOrder: "asc" },
          include: {
            checkpoints: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[AUDIT_TEMPLATE_PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// DELETE /api/audit/templates/[templateId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    await prisma.auditTemplate.delete({
      where: { id: params.templateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AUDIT_TEMPLATE_DELETE]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
