import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET /api/audit - List audits for a hotel
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const roomId = req.nextUrl.searchParams.get("roomId");
  const templateId = req.nextUrl.searchParams.get("templateId");
  const dateFrom = req.nextUrl.searchParams.get("dateFrom");
  const dateTo = req.nextUrl.searchParams.get("dateTo");

  const where: any = {
    room: { hotelId },
  };

  if (roomId) where.roomId = roomId;
  if (templateId) where.templateId = templateId;
  if (dateFrom || dateTo) {
    where.startedAt = {};
    if (dateFrom) where.startedAt.gte = new Date(dateFrom);
    if (dateTo) where.startedAt.lte = new Date(dateTo);
  }

  try {
    const pagination = parsePagination(req);
    const [audits, total] = await Promise.all([
      prisma.roomAudit.findMany({
        where,
        include: {
          room: { select: { id: true, number: true, floor: true } },
          template: { select: { id: true, name: true, scoringMode: true } },
          auditor: { select: { id: true, name: true, email: true } },
          _count: { select: { results: true } },
        },
        orderBy: { startedAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.roomAudit.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(audits, total, pagination));
  } catch (error) {
    console.error("[AUDIT_GET]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST /api/audit - Create a new audit with checkpoint results
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { templateId, roomId, results, duration, notes } = body;

    if (!templateId || !roomId || !results?.length) {
      return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
    }

    const auditorId = (session.user as any).id;

    // Load template checkpoints to compute score
    const template = await prisma.auditTemplate.findUnique({
      where: { id: templateId },
      include: {
        zones: {
          include: { checkpoints: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template introuvable" }, { status: 404 });
    }

    // Build checkpoint map for scoring
    const checkpointMap = new Map<string, { weight: number; isBlocking: boolean }>();
    for (const zone of template.zones) {
      for (const cp of zone.checkpoints) {
        checkpointMap.set(cp.id, { weight: cp.weight, isBlocking: cp.isBlocking });
      }
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    let hasBlockingFail = false;

    for (const result of results) {
      const cp = checkpointMap.get(result.checkpointId);
      if (!cp) continue;

      maxScore += cp.weight;
      if (result.passed) {
        totalScore += cp.weight;
      } else if (result.passed === false && cp.isBlocking) {
        hasBlockingFail = true;
      }
    }

    const scorePercent = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = !hasBlockingFail && scorePercent >= 80;

    const audit = await prisma.roomAudit.create({
      data: {
        templateId,
        roomId,
        auditorId,
        score: Math.round(scorePercent * 100) / 100,
        maxScore: maxScore,
        passed,
        duration: duration || null,
        notes: notes || null,
        completedAt: new Date(),
        results: {
          create: results.map((r: any) => ({
            checkpointId: r.checkpointId,
            passed: r.passed ?? null,
            score: r.score ?? null,
            comment: r.comment || null,
          })),
        },
      },
      include: {
        room: { select: { id: true, number: true, floor: true } },
        template: { select: { id: true, name: true } },
        results: true,
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error("[AUDIT_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
