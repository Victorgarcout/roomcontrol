import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { categories } = await req.json();
    const { hotelId } = params;

    const created = await Promise.all(
      categories.map((cat: any) =>
        prisma.roomCategory.create({
          data: {
            hotelId,
            name: cat.name,
            description: cat.description || null,
            price: parseFloat(cat.price) || 0,
            capacity: parseInt(cat.capacity) || 2,
            amenities: cat.amenities || null,
            photo: cat.photo || null,
          },
        })
      )
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[CATEGORIES_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const categories = await prisma.roomCategory.findMany({
    where: { hotelId: params.hotelId },
    include: { _count: { select: { rooms: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}
