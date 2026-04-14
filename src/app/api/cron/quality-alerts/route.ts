import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToRole } from "@/lib/web-push";

/**
 * Vercel Cron: Daily quality alerts
 * Schedule: every day at 8:00 AM (0 8 * * *)
 * Protected by CRON_SECRET
 *
 * Checks for:
 * - Urgent tickets (HAUTE + A_FAIRE) older than 48h
 * - Overdue supplier maintenance checks
 * - Uncompleted rituals on Fridays
 * - Overdue quarterly audits
 * - Unresolved safety commissions > 30 days
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isFriday = now.getDay() === 5;

  const hotels = await prisma.hotel.findMany({
    select: { id: true, name: true },
  });

  const allAlerts: {
    hotelId: string;
    hotelName: string;
    alerts: { type: string; count: number; details: string }[];
  }[] = [];

  for (const hotel of hotels) {
    const alerts: { type: string; count: number; details: string }[] = [];

    // 1. Urgent tickets not handled > 48h
    const urgentTickets = await prisma.maintenanceTicket.count({
      where: {
        hotelId: hotel.id,
        priority: "HAUTE",
        status: "A_FAIRE",
        createdAt: { lt: twoDaysAgo },
      },
    });
    if (urgentTickets > 0) {
      alerts.push({
        type: "urgent_tickets",
        count: urgentTickets,
        details: `${urgentTickets} ticket(s) urgents non traites depuis +48h`,
      });

      // Push notification to OPE_TECHNIQUE
      await sendPushToRole(hotel.id, ["OPE_TECHNIQUE", "ADMIN"], {
        title: `${urgentTickets} ticket(s) urgent(s)`,
        body: `${hotel.name}: tickets haute priorite en attente depuis +48h`,
        url: "/quality/technique",
        tag: "urgent-ticket",
      });
    }

    // 2. Overdue supplier maintenance
    const suppliers = await prisma.supplierMaint.findMany({
      where: { hotelId: hotel.id },
      select: { equipment: true, lastCheck: true, frequency: true },
    });
    const overdueSuppliers = suppliers.filter((s) => {
      if (!s.lastCheck) return true;
      const freqMonths: Record<string, number> = {
        Mensuelle: 1, Trimestrielle: 3, Semestrielle: 6,
        Annuelle: 12, "Tri-annuelle": 36, Quinquennale: 60,
      };
      const months = freqMonths[s.frequency] ?? 12;
      const due = new Date(s.lastCheck);
      due.setMonth(due.getMonth() + months);
      return now > due;
    });
    if (overdueSuppliers.length > 0) {
      alerts.push({
        type: "overdue_suppliers",
        count: overdueSuppliers.length,
        details: `${overdueSuppliers.length} fournisseur(s) en retard: ${overdueSuppliers.map((s) => s.equipment).join(", ")}`,
      });

      await sendPushToRole(hotel.id, ["ADMIN"], {
        title: "Fournisseurs en retard",
        body: `${hotel.name}: ${overdueSuppliers.length} controle(s) en retard`,
        url: "/quality/technique",
        tag: "overdue-supplier",
      });
    }

    // 3. Rituals not completed (Friday only)
    if (isFriday) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const completedRituals = await prisma.ritualCheck.count({
        where: {
          hotelId: hotel.id,
          weekStart,
          done: true,
        },
      });

      const totalRituals = 11; // from RITUALS reference data
      if (completedRituals < totalRituals) {
        const missing = totalRituals - completedRituals;
        alerts.push({
          type: "incomplete_rituals",
          count: missing,
          details: `${missing} rituel(s) non valide(s) cette semaine`,
        });

        await sendPushToRole(hotel.id, ["ADMIN", "OPE_HEBERGEMENT"], {
          title: "Rituels incomplets",
          body: `${hotel.name}: ${missing} rituel(s) a valider avant ce soir`,
          url: "/quality/rituels",
          tag: "incomplete-rituals",
        });
      }
    }

    // 4. Quarterly audit overdue (> 90 days since last)
    const lastAudit = await prisma.hotelAudit.findFirst({
      where: { hotelId: hotel.id },
      orderBy: { auditDate: "desc" },
      select: { auditDate: true },
    });
    if (!lastAudit || (now.getTime() - lastAudit.auditDate.getTime()) > 90 * 24 * 60 * 60 * 1000) {
      const daysSince = lastAudit
        ? Math.floor((now.getTime() - lastAudit.auditDate.getTime()) / (24 * 60 * 60 * 1000))
        : null;
      alerts.push({
        type: "audit_overdue",
        count: 1,
        details: daysSince
          ? `Dernier audit il y a ${daysSince} jours`
          : "Aucun audit realise",
      });

      await sendPushToRole(hotel.id, ["ADMIN", "SUPER_ADMIN"], {
        title: "Rappel audit trimestriel",
        body: `${hotel.name}: audit qualite a planifier`,
        url: "/quality/audit",
        tag: "audit-reminder",
      });
    }

    // 5. Safety commission reserves unresolved > 30 days
    const commissions = await prisma.safetyCommission.findMany({
      where: {
        hotelId: hotel.id,
        result: "favorable_avec_reserves",
      },
      select: { prescriptions: true, visitDate: true },
    });
    let unresolvedCount = 0;
    for (const c of commissions) {
      const prescriptions = c.prescriptions as any[];
      if (Array.isArray(prescriptions)) {
        unresolvedCount += prescriptions.filter(
          (p: any) => !p.resolved && c.visitDate < thirtyDaysAgo
        ).length;
      }
    }
    if (unresolvedCount > 0) {
      alerts.push({
        type: "safety_reserves",
        count: unresolvedCount,
        details: `${unresolvedCount} prescription(s) non levee(s) depuis +30j`,
      });

      await sendPushToRole(hotel.id, ["ADMIN"], {
        title: "Reserves securite non levees",
        body: `${hotel.name}: ${unresolvedCount} prescription(s) en attente`,
        url: "/quality/securite",
        tag: "safety-reserves",
      });
    }

    if (alerts.length > 0) {
      allAlerts.push({ hotelId: hotel.id, hotelName: hotel.name, alerts });
    }
  }

  // Send email alerts via Resend if configured
  if (allAlerts.length > 0 && process.env.RESEND_API_KEY) {
    for (const hotelAlerts of allAlerts) {
      // Find ADMIN users for this hotel
      const admins = await prisma.hotelUser.findMany({
        where: {
          hotelId: hotelAlerts.hotelId,
          role: { in: ["ADMIN", "SUPER_ADMIN"] as any },
        },
        include: { user: { select: { email: true, name: true } } },
      });

      for (const admin of admins) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.MAIL_FROM || "noreply@somnoo.app",
              to: admin.user.email,
              subject: `[somnOO] ${hotelAlerts.alerts.length} alerte(s) qualite - ${hotelAlerts.hotelName}`,
              html: buildAlertEmailHtml(hotelAlerts.hotelName, hotelAlerts.alerts),
            }),
          });
        } catch (err) {
          console.error(`[Quality Alerts] Email error for ${admin.user.email}:`, err);
        }
      }
    }
  }

  console.log(`[Quality Alerts] ${allAlerts.length} hotel(s) with alerts`);

  return NextResponse.json({
    hotelsChecked: hotels.length,
    hotelsWithAlerts: allAlerts.length,
    alerts: allAlerts,
  });
}

function buildAlertEmailHtml(
  hotelName: string,
  alerts: { type: string; count: number; details: string }[]
): string {
  const alertRows = alerts
    .map(
      (a) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #EDE9E3;font-size:14px;color:#1B2A4A;">
          <strong>${a.details}</strong>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="max-width:480px;margin:0 auto;font-family:'Outfit',system-ui,sans-serif;background:#F5F3EE;padding:24px;">
      <div style="background:linear-gradient(135deg,#1B2A4A,#253759);border-radius:18px;padding:24px;margin-bottom:20px;">
        <div style="font-size:10px;font-weight:700;color:#D4BC8A;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">somnOO Quality</div>
        <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;">${hotelName}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Alertes qualite du ${new Date().toLocaleDateString("fr-FR")}</p>
      </div>
      <div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #EDE9E3;">
        <table style="width:100%;border-collapse:collapse;">
          ${alertRows}
        </table>
      </div>
      <p style="text-align:center;margin-top:20px;font-size:12px;color:#8E96A4;">
        Connectez-vous a somnOO Quality pour traiter ces alertes.
      </p>
    </div>
  `;
}
