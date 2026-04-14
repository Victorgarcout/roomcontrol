import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser, sendPushToRole } from "@/lib/web-push";
import { z } from "zod";

const sendSchema = z.object({
  // Either userId or hotelId+roles must be provided
  userId: z.string().optional(),
  hotelId: z.string().optional(),
  roles: z.array(z.string()).optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  tag: z.string().optional(),
});

// POST /api/push/send — send a push notification (internal, admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
    tag: parsed.data.tag,
  };

  let sent = 0;

  if (parsed.data.userId) {
    sent = await sendPushToUser(parsed.data.userId, payload);
  } else if (parsed.data.hotelId && parsed.data.roles) {
    sent = await sendPushToRole(parsed.data.hotelId, parsed.data.roles, payload);
  } else {
    return NextResponse.json(
      { error: "userId ou hotelId+roles requis" },
      { status: 400 }
    );
  }

  return NextResponse.json({ sent });
}
