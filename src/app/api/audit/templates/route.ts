import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit/templates - List templates for a hotel
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  try {
    const templates = await prisma.auditTemplate.findMany({
      where: { hotelId },
      include: {
        zones: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { checkpoints: true } },
          },
        },
        _count: { select: { audits: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[AUDIT_TEMPLATES_GET]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// POST /api/audit/templates - Create a new template with zones and checkpoints
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { hotelId, name, description, scoringMode, zones } = body;

    if (!hotelId || !name) {
      return NextResponse.json({ error: "hotelId et name requis" }, { status: 400 });
    }

    const template = await prisma.auditTemplate.create({
      data: {
        hotelId,
        name,
        description: description || null,
        scoringMode: scoringMode || "BINARY",
        zones: zones?.length
          ? {
              create: zones.map((zone: any, zi: number) => ({
                name: zone.name,
                sortOrder: zi,
                checkpoints: zone.checkpoints?.length
                  ? {
                      create: zone.checkpoints.map((cp: any, ci: number) => ({
                        label: cp.label,
                        subCategory: cp.subCategory || null,
                        sortOrder: ci,
                        weight: cp.weight ?? 1,
                        isBlocking: cp.isBlocking ?? false,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        zones: {
          orderBy: { sortOrder: "asc" },
          include: {
            checkpoints: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[AUDIT_TEMPLATES_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
