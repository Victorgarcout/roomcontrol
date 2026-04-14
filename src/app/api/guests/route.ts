import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pagination = parsePagination(req);
  const [guests, total] = await Promise.all([
    prisma.guest.findMany({
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.guest.count(),
  ]);

  return NextResponse.json(paginatedResponse(guests, total, pagination));
}
