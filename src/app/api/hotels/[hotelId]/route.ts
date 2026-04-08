import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const hotel = await prisma.hotel.findUnique({
    where: { id: params.hotelId },
    include: {
      categories: { include: { _count: { select: { rooms: true } } } },
      _count: { select: { rooms: true, bookings: true } },
    },
  });

  if (!hotel) {
    return NextResponse.json({ error: "Hotel introuvable" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}

export async function PATCH(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const hotel = await prisma.hotel.update({
      where: { id: params.hotelId },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logo: body.logo,
      },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error("[HOTEL_PATCH]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
