import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

// POST /api/push/unsubscribe — remove a push subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await prisma.pushSubscription.delete({
      where: { endpoint: parsed.data.endpoint },
    });
  } catch {
    // Already deleted or doesn't exist — that's fine
  }

  return NextResponse.json({ success: true });
}
