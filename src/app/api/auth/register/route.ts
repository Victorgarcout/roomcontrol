import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: "ADMIN",
      },
    });

    // Send welcome email
    await sendMail({
      to: email,
      subject: "Bienvenue sur RoomControl",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Bienvenue sur RoomControl !</h1>
          <p>Bonjour ${name},</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter et commencer à configurer votre hôtel.</p>
          <a href="${process.env.NEXTAUTH_URL}/login" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Se connecter</a>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Compte créé avec succès", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
