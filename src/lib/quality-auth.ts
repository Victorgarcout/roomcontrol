import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export type QualityRole = "SUPER_ADMIN" | "ADMIN" | "OPE_HEBERGEMENT" | "OPE_TECHNIQUE";
export type AccessLevel = "RW" | "R" | "W" | "RW_LIMITED" | "NONE";

// RBAC Matrix from architecture doc
const ACCESS_MATRIX: Record<string, Record<QualityRole, AccessLevel>> = {
  performance:          { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "R",          OPE_TECHNIQUE: "NONE" },
  actions:              { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "RW_LIMITED",  OPE_TECHNIQUE: "NONE" },
  rituals:              { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "RW",          OPE_TECHNIQUE: "NONE" },
  "maintenance-tickets":{ SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "W",           OPE_TECHNIQUE: "RW" },
  "room-equip":         { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "NONE",        OPE_TECHNIQUE: "RW" },
  "common-areas":       { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "NONE",        OPE_TECHNIQUE: "RW" },
  suppliers:            { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "NONE",        OPE_TECHNIQUE: "RW" },
  safety:               { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "NONE",        OPE_TECHNIQUE: "R" },
  "hotel-audit":        { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "NONE",        OPE_TECHNIQUE: "NONE" },
  "room-inspection":    { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "RW",          OPE_TECHNIQUE: "NONE" },
  playbook:             { SUPER_ADMIN: "RW", ADMIN: "RW", OPE_HEBERGEMENT: "R",           OPE_TECHNIQUE: "NONE" },
  hub:                  { SUPER_ADMIN: "R",  ADMIN: "R",  OPE_HEBERGEMENT: "R",           OPE_TECHNIQUE: "R" },
};

interface QualityAccessResult {
  user: { id: string; role: QualityRole; name?: string | null; email: string };
  accessLevel: AccessLevel;
}

/**
 * Check that user has access to a quality module for a given hotel.
 * Returns user info + access level, or a NextResponse error.
 */
export async function requireQualityAccess(
  hotelId: string,
  module: string,
  requiredAccess: "R" | "W" = "R"
): Promise<QualityAccessResult | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role as QualityRole;

  // SUPER_ADMIN has access to all hotels
  if (userRole !== "SUPER_ADMIN") {
    const hotelUser = await prisma.hotelUser.findUnique({
      where: { userId_hotelId: { userId, hotelId } },
    });
    if (!hotelUser) {
      return NextResponse.json({ error: "Accès refusé à cet hôtel" }, { status: 403 });
    }
  }

  const moduleAccess = ACCESS_MATRIX[module];
  if (!moduleAccess) {
    return NextResponse.json({ error: "Module inconnu" }, { status: 400 });
  }

  const accessLevel = moduleAccess[userRole] || "NONE";

  if (accessLevel === "NONE") {
    return NextResponse.json({ error: "Accès refusé à ce module" }, { status: 403 });
  }

  // Check if the required access matches
  if (requiredAccess === "W") {
    if (accessLevel === "R") {
      return NextResponse.json({ error: "Accès en lecture seule" }, { status: 403 });
    }
  }

  return {
    user: {
      id: userId,
      role: userRole,
      name: (session.user as any).name,
      email: (session.user as any).email,
    },
    accessLevel,
  };
}

/**
 * Helper to check if the result is an error response.
 */
export function isErrorResponse(result: QualityAccessResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
