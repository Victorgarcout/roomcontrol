import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      room: { include: { category: true } },
      guest: true,
      createdBy: { select: { name: true } },
      payments: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PATCH(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userId = (session.user as any).id;
    const { action, ...data } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: { room: true, guest: true, hotel: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Check-in action
    if (action === "checkin") {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: params.bookingId },
          data: { status: "CHECKED_IN" },
        });

        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: "OCCUPIED" },
        });

        await tx.statusHistory.create({
          data: {
            roomId: booking.roomId,
            fromStatus: booking.room.status,
            toStatus: "OCCUPIED",
            changedBy: userId,
            notes: `Check-in: ${booking.guest.firstName} ${booking.guest.lastName}`,
          },
        });

        return b;
      });

      return NextResponse.json(updated);
    }

    // Check-out action
    if (action === "checkout") {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: params.bookingId },
          data: { status: "CHECKED_OUT" },
        });

        await tx.room.update({
          where: { id: booking.roomId },
          data: { status: "CLEANING" },
        });

        await tx.statusHistory.create({
          data: {
            roomId: booking.roomId,
            fromStatus: "OCCUPIED",
            toStatus: "CLEANING",
            changedBy: userId,
            notes: `Check-out: ${booking.guest.firstName} ${booking.guest.lastName}`,
          },
        });

        return b;
      });

      // Send checkout email
      if (booking.guest.email) {
        await sendMail({
          to: booking.guest.email,
          subject: `Check-out - ${booking.hotel.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e40af;">${booking.hotel.name}</h1>
              <h2>Merci pour votre séjour !</h2>
              <p>Bonjour ${booking.guest.firstName},</p>
              <p>Nous espérons que votre séjour a été agréable.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #666;">Chambre</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">#${booking.room.number}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #666;">Arrivée</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(booking.checkIn)}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #666;">Départ</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(booking.checkOut)}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #666;">Nuits</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${booking.nights}</td></tr>
                <tr><td style="padding: 8px; color: #666;">Total</td><td style="padding: 8px; font-weight: bold; font-size: 18px; color: #1e40af;">${formatCurrency(booking.totalAmount)}</td></tr>
              </table>
              <p style="color: #666;">À bientôt !</p>
            </div>
          `,
        });

        await prisma.mailLog.create({
          data: {
            hotelId: booking.hotelId,
            userId,
            to: booking.guest.email,
            subject: `Check-out - ${booking.hotel.name}`,
            type: "CHECKOUT",
          },
        });
      }

      return NextResponse.json(updated);
    }

    // Cancel action
    if (action === "cancel") {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: params.bookingId },
          data: { status: "CANCELLED" },
        });

        if (booking.room.status === "OCCUPIED") {
          await tx.room.update({
            where: { id: booking.roomId },
            data: { status: "AVAILABLE" },
          });
        }

        return b;
      });

      return NextResponse.json(updated);
    }

    // Generic update
    const updated = await prisma.booking.update({
      where: { id: params.bookingId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[BOOKING_PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
