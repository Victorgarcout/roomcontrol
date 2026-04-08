import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/[auditId] - Get audit with all results
export async function GET(
  req: NextRequest,
  { params }: { params: { auditId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const audit = await prisma.roomAudit.findUnique({
      where: { id: params.auditId },
      include: {
        room: { select: { id: true, number: true, floor: true } },
        template: {
          include: {
            zones: {
              orderBy: { sortOrder: "asc" },
              include: {
                checkpoints: { orderBy: { sortOrder: "asc" } },
              },
            },
          },
        },
        auditor: { select: { id: true, name: true, email: true } },
        results: {
          include: {
            checkpoint: {
              include: {
                zone: { select: { id: true, name: true } },
              },
            },
          },
        },
        photos: true,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit introuvable" }, { status: 404 });
    }

    // Compute per-zone scores
    const zoneScores: Record<string, { name: string; passed: number; total: number; score: number }> = {};

    for (const result of audit.results) {
      const zoneId = result.checkpoint.zone.id;
      const zoneName = result.checkpoint.zone.name;
      if (!zoneScores[zoneId]) {
        zoneScores[zoneId] = { name: zoneName, passed: 0, total: 0, score: 0 };
      }
      zoneScores[zoneId].total += 1;
      if (result.passed) {
        zoneScores[zoneId].passed += 1;
      }
    }

    for (const zs of Object.values(zoneScores)) {
      zs.score = zs.total > 0 ? Math.round((zs.passed / zs.total) * 100 * 100) / 100 : 0;
    }

    // Get previous audit of same room for comparison
    const previousAudit = await prisma.roomAudit.findFirst({
      where: {
        roomId: audit.roomId,
        id: { not: audit.id },
        completedAt: { lt: audit.startedAt },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        score: true,
        passed: true,
        startedAt: true,
      },
    });

    return NextResponse.json({
      ...audit,
      zoneScores,
      previousAudit,
    });
  } catch (error) {
    console.error("[AUDIT_ID_GET]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// PATCH /api/audit/[auditId] - Update audit (notes, signature)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { auditId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notes, signature } = body;

    const data: any = {};
    if (notes !== undefined) data.notes = notes;
    if (signature !== undefined) data.signature = signature;

    const audit = await prisma.roomAudit.update({
      where: { id: params.auditId },
      data,
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error("[AUDIT_ID_PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
