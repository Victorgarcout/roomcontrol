import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { v4 as uuidv4 } from "uuid";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 req/min
    const rateLimitResponse = await rateLimit("forgotPassword", getClientIdentifier(req));
    if (rateLimitResponse) return rateLimitResponse;

    const { email } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." });
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    await sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe - RoomControl",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e40af;">Réinitialisation du mot de passe</h1>
          <p>Bonjour ${user.name || ""},</p>
          <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Réinitialiser le mot de passe</a>
          <p style="color: #666; margin-top: 16px;">Ce lien expire dans 1 heure.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Si ce compte existe, un email a été envoyé." });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
