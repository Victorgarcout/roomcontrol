import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const smtpTransport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendMail({ to, subject, html, from }: SendMailOptions) {
  const sender = from || process.env.MAIL_FROM || "noreply@roomcontrol.app";

  try {
    if (resend) {
      const { error } = await resend.emails.send({
        from: sender,
        to,
        subject,
        html,
      });
      if (error) throw new Error(error.message);
      return { success: true };
    }

    if (smtpTransport) {
      await smtpTransport.sendMail({ from: sender, to, subject, html });
      return { success: true };
    }

    console.warn("[MAIL] No mail provider configured. Email not sent:", { to, subject });
    return { success: false, error: "No mail provider configured" };
  } catch (error: any) {
    console.error("[MAIL] Error:", error.message);
    return { success: false, error: error.message };
  }
}
