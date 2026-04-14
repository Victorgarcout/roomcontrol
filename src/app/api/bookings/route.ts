import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quickBookingSchema, advancedBookingSchema } from "@/lib/validations";
import { calculateNights } from "@/lib/utils";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const hotelId = req.nextUrl.searchParams.get("hotelId");
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const where: any = { hotelId };
  if (status) where.status = status;
  if (from) where.checkIn = { gte: new Date(from) };
  if (to) where.checkOut = { ...where.checkOut, lte: new Date(to) };

  const pagination = parsePagination(req);
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        room: { select: { id: true, number: true, category: { select: { name: true } } } },
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { checkIn: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(bookings, total, pagination));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const isQuickMode = body.quickMode !== false;
    const schema = isQuickMode ? quickBookingSchema : advancedBookingSchema;
    const data = schema.parse(body);

    const userId = (session.user as any).id;
    const hotelId = body.hotelId;

    if (!hotelId) {
      return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
    }

    // Get room rate
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { category: true },
    });
    if (!room) {
      return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 });
    }

    const nights = calculateNights(data.checkIn, data.checkOut);
    if (nights < 1) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    const ratePerNight = room.category.price;
    const discount = (data as any).discount || 0;
    const subtotal = ratePerNight * nights;
    const totalAmount = subtotal - (subtotal * discount / 100);

    // Create or find guest
    let guest = await prisma.guest.findFirst({
      where: {
        firstName: data.guestFirstName,
        lastName: data.guestLastName,
      },
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          firstName: data.guestFirstName,
          lastName: data.guestLastName,
          email: (data as any).guestEmail || undefined,
          phone: (data as any).guestPhone || undefined,
          nationality: (data as any).guestNationality || undefined,
          idNumber: (data as any).guestIdNumber || undefined,
          company: (data as any).company || undefined,
          companyVat: (data as any).companyVat || undefined,
        },
      });
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          hotelId,
          roomId: data.roomId,
          guestId: guest!.id,
          createdById: userId,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          nights,
          guests: data.guests,
          status: "CONFIRMED",
          ratePerNight,
          discount,
          totalAmount,
          paymentMethod: data.paymentMethod,
          breakfast: (data as any).breakfast || false,
          parking: (data as any).parking || false,
          babyBed: (data as any).babyBed || false,
          transfer: (data as any).transfer || false,
          isProInvoice: (data as any).isProInvoice || false,
          notes: data.notes,
          specialRequests: (data as any).specialRequests,
          quickMode: isQuickMode,
        },
        include: {
          room: { select: { number: true } },
          guest: true,
        },
      });

      // Update room status
      await tx.room.update({
        where: { id: data.roomId },
        data: { status: "OCCUPIED" },
      });

      await tx.statusHistory.create({
        data: {
          roomId: data.roomId,
          fromStatus: room.status,
          toStatus: "OCCUPIED",
          changedBy: userId,
          notes: `Réservation #${newBooking.id}`,
        },
      });

      return newBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[BOOKINGS_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
