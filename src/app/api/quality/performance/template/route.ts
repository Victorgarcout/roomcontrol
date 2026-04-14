import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

/**
 * GET /api/quality/performance/template
 * Downloads an Excel template pre-filled with column headers and month rows.
 */
export async function GET() {
  const currentYear = new Date().getFullYear();
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const headers = [
    "Année", "Mois", "RPS", "RPS N-1", "Comp Index",
    "Nb Avis", "Taux Réponse",
    "Impact Négatif 1", "Impact Négatif 2", "Impact Négatif 3",
    "Impact Positif 1", "Impact Positif 2", "Impact Positif 3",
    "Sparkles", "Animations", "Commentaires",
  ];

  // Create 12 empty rows for the current year
  const rows = months.map((m) => [currentYear, m, "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = [
    { wch: 8 },  // Année
    { wch: 12 }, // Mois
    { wch: 8 },  // RPS
    { wch: 8 },  // RPS N-1
    { wch: 12 }, // Comp Index
    { wch: 10 }, // Nb Avis
    { wch: 14 }, // Taux Réponse
    { wch: 20 }, // Impact Négatif 1
    { wch: 20 }, // Impact Négatif 2
    { wch: 20 }, // Impact Négatif 3
    { wch: 20 }, // Impact Positif 1
    { wch: 20 }, // Impact Positif 2
    { wch: 20 }, // Impact Positif 3
    { wch: 10 }, // Sparkles
    { wch: 12 }, // Animations
    { wch: 30 }, // Commentaires
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Performance");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="somnoo-performance-template-${currentYear}.xlsx"`,
    },
  });
}
