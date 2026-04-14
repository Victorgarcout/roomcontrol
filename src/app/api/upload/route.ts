import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateImage, uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const hotelId = formData.get("hotelId") as string | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!hotelId) {
      return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
    }

    const validTypes = ["audits", "rooms", "safety", "logos"];
    const folder = `somnoo/${hotelId}/${validTypes.includes(type || "") ? type : "general"}`;

    // Validate image
    const validationError = validateImage(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Convert to buffer and upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadImage(buffer, folder);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[UPLOAD]", error);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
