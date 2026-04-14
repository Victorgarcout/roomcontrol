import webPush from "web-push";
import { prisma } from "@/lib/prisma";

// Configure VAPID keys (generate once: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@somnoo.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export { VAPID_PUBLIC_KEY };

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a specific user.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent++;
    } catch (error: any) {
      // 410 Gone or 404: subscription expired, clean up
      if (error.statusCode === 410 || error.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
        console.log(`[Push] Cleaned expired subscription ${sub.id}`);
      } else {
        console.error(`[Push] Error sending to ${sub.endpoint}:`, error.message);
      }
    }
  }
  return sent;
}

/**
 * Send a push notification to all users with a specific role for a hotel.
 */
export async function sendPushToRole(
  hotelId: string,
  roles: string[],
  payload: PushPayload
): Promise<number> {
  const hotelUsers = await prisma.hotelUser.findMany({
    where: {
      hotelId,
      role: { in: roles as any },
    },
    select: { userId: true },
  });

  let totalSent = 0;
  for (const hu of hotelUsers) {
    const sent = await sendPushToUser(hu.userId, payload);
    totalSent += sent;
  }
  return totalSent;
}
