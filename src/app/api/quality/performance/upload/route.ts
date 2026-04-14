import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireQualityAccess, isErrorResponse } from "@/lib/quality-auth";
import * as XLSX from "xlsx";

/**
 * POST /api/quality/performance/upload
 *
 * Accepts an Excel file (.xlsx / .xls) via multipart/form-data.
 * Required form fields: file, hotelId
 *
 * Expected Excel columns (case-insensitive, first row = headers):
 *   Année | Mois | RPS | RPS N-1 | Comp Index | Nb Avis | Taux Réponse |
 *   Impact Négatif 1 | Impact Négatif 2 | Impact Négatif 3 |
 *   Impact Positif 1 | Impact Positif 2 | Impact Positif 3 |
 *   Sparkles | Animations | Commentaires
 *
 * Each row = one month. Existing data is upserted (updated or created).
 */

// Column name mapping (normalized lowercase → MonthlyPerf field)
const COL_MAP: Record<string, string> = {
  "annee": "year",
  "année": "year",
  "year": "year",
  "mois": "month",
  "month": "month",
  "rps": "rps",
  "rps n-1": "rpsN1",
  "rps n1": "rpsN1",
  "rpsn1": "rpsN1",
  "comp index": "compIndex",
  "compindex": "compIndex",
  "index concurrence": "compIndex",
  "nb avis": "nbReviews",
  "nbavis": "nbReviews",
  "nombre avis": "nbReviews",
  "reviews": "nbReviews",
  "taux reponse": "responseRate",
  "taux réponse": "responseRate",
  "response rate": "responseRate",
  "tauxreponse": "responseRate",
  "impact negatif 1": "negImpact1",
  "impact négatif 1": "negImpact1",
  "neg1": "negImpact1",
  "impact negatif 2": "negImpact2",
  "impact négatif 2": "negImpact2",
  "neg2": "negImpact2",
  "impact negatif 3": "negImpact3",
  "impact négatif 3": "negImpact3",
  "neg3": "negImpact3",
  "impact positif 1": "posImpact1",
  "pos1": "posImpact1",
  "impact positif 2": "posImpact2",
  "pos2": "posImpact2",
  "impact positif 3": "posImpact3",
  "pos3": "posImpact3",
  "sparkles": "sparkles",
  "animations": "animations",
  "commentaires": "comments",
  "comments": "comments",
};

// Month name → number mapping
const MONTH_NAMES: Record<string, number> = {
  janvier: 1, jan: 1, "01": 1,
  février: 2, fevrier: 2, fev: 2, feb: 2, "02": 2,
  mars: 3, mar: 3, "03": 3,
  avril: 4, avr: 4, apr: 4, "04": 4,
  mai: 5, may: 5, "05": 5,
  juin: 6, jun: 6, "06": 6,
  juillet: 7, juil: 7, jul: 7, "07": 7,
  août: 8, aout: 8, aug: 8, "08": 8,
  septembre: 9, sep: 9, "09": 9,
  octobre: 10, oct: 10, "10": 10,
  novembre: 11, nov: 11, "11": 11,
  décembre: 12, decembre: 12, dec: 12, "12": 12,
};

function parseMonth(v: unknown): number | null {
  if (typeof v === "number") return v >= 1 && v <= 12 ? Math.round(v) : null;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1 && n <= 12) return n;
    return MONTH_NAMES[v.toLowerCase().trim()] ?? null;
  }
  return null;
}

function parseYear(v: unknown): number | null {
  if (typeof v === "number") return v >= 2020 && v <= 2100 ? Math.round(v) : null;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return !isNaN(n) && n >= 2020 && n <= 2100 ? n : null;
  }
  return null;
}

function parseNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? undefined : n;
}

function parseStr(v: unknown): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  return String(v).trim();
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const hotelId = formData.get("hotelId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
  }
  if (!hotelId) {
    return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
  }

  // RBAC check
  const access = await requireQualityAccess(hotelId, "performance", "W");
  if (isErrorResponse(access)) return access;

  // Validate file type
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez .xlsx, .xls ou .csv" },
      { status: 400 }
    );
  }

  // Read file
  const buffer = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return NextResponse.json(
      { error: "Impossible de lire le fichier Excel" },
      { status: 400 }
    );
  }

  // Use first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune ligne trouvée" }, { status: 400 });
  }

  // Map columns
  const firstRow = rows[0];
  const colMapping: Record<string, string> = {};
  for (const rawKey of Object.keys(firstRow)) {
    const normalized = rawKey.toLowerCase().trim().replace(/\s+/g, " ");
    const mapped = COL_MAP[normalized];
    if (mapped) {
      colMapping[rawKey] = mapped;
    }
  }

  // Check required columns
  const mappedFields = new Set(Object.values(colMapping));
  if (!mappedFields.has("year") || !mappedFields.has("month")) {
    return NextResponse.json(
      {
        error: "Colonnes 'Année' et 'Mois' requises",
        colonnesTrouvées: Object.keys(firstRow),
        colonnesReconnues: Object.entries(colMapping).map(([k, v]) => `${k} → ${v}`),
      },
      { status: 400 }
    );
  }

  // Process rows
  const results: { row: number; year: number; month: number; status: string }[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mapped: Record<string, unknown> = {};

    for (const [excelCol, field] of Object.entries(colMapping)) {
      mapped[field] = row[excelCol];
    }

    const year = parseYear(mapped.year);
    const month = parseMonth(mapped.month);

    if (!year || !month) {
      errors.push({ row: i + 2, error: `Année ou mois invalide: ${mapped.year}/${mapped.month}` });
      continue;
    }

    const data = {
      rps: parseNum(mapped.rps),
      rpsN1: parseNum(mapped.rpsN1),
      compIndex: parseNum(mapped.compIndex),
      nbReviews: parseNum(mapped.nbReviews) !== undefined ? Math.round(parseNum(mapped.nbReviews)!) : undefined,
      responseRate: parseNum(mapped.responseRate),
      negImpact1: parseStr(mapped.negImpact1),
      negImpact2: parseStr(mapped.negImpact2),
      negImpact3: parseStr(mapped.negImpact3),
      posImpact1: parseStr(mapped.posImpact1),
      posImpact2: parseStr(mapped.posImpact2),
      posImpact3: parseStr(mapped.posImpact3),
      sparkles: parseNum(mapped.sparkles) !== undefined ? Math.round(parseNum(mapped.sparkles)!) : undefined,
      animations: parseNum(mapped.animations) !== undefined ? Math.round(parseNum(mapped.animations)!) : undefined,
      comments: parseStr(mapped.comments),
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    try {
      await prisma.monthlyPerf.upsert({
        where: { hotelId_year_month: { hotelId, year, month } },
        update: cleanData,
        create: { hotelId, year, month, ...cleanData },
      });
      results.push({ row: i + 2, year, month, status: "ok" });
    } catch (err) {
      errors.push({ row: i + 2, error: `Erreur BDD: ${(err as Error).message}` });
    }
  }

  return NextResponse.json({
    imported: results.length,
    errors: errors.length,
    total: rows.length,
    details: { success: results, errors },
    colonnesReconnues: Object.entries(colMapping).map(([k, v]) => `${k} → ${v}`),
  });
}
