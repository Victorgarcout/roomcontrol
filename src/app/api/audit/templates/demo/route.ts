import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEMO_ZONES = [
  {
    name: "Zone d'entree",
    checkpoints: [
      // Nettoyage / assainissement (1-25)
      { label: "Couloir a l'exterieur de la piece", subCategory: "Nettoyage / assainissement", sortOrder: 0 },
      { label: "Portes (poignees / supports / ferme-porte)", subCategory: "Nettoyage / assainissement", sortOrder: 1 },
      { label: "Marchepied / entree propre", subCategory: "Nettoyage / assainissement", sortOrder: 2 },
      { label: "Fiches / interrupteurs", subCategory: "Nettoyage / assainissement", sortOrder: 3 },
      { label: "Murs et plafonds", subCategory: "Nettoyage / assainissement", sortOrder: 4 },
      { label: "Miroir et photos", subCategory: "Nettoyage / assainissement", sortOrder: 5 },
      { label: "Television / telecommande", subCategory: "Nettoyage / assainissement", sortOrder: 6 },
      { label: "Plateau Cafe - The et bouilloire", subCategory: "Nettoyage / assainissement", sortOrder: 7 },
      { label: "Garde-robe", subCategory: "Nettoyage / assainissement", sortOrder: 8 },
      { label: "Surface de travail / Bureau", subCategory: "Nettoyage / assainissement", sortOrder: 9 },
      { label: "Chaises / sieges", subCategory: "Nettoyage / assainissement", sortOrder: 10 },
      { label: "Telephone", subCategory: "Nettoyage / assainissement", sortOrder: 11 },
      { label: "Tiroirs (Exterieur et interieur)", subCategory: "Nettoyage / assainissement", sortOrder: 12 },
      { label: "Fenetre - a l'interieur", subCategory: "Nettoyage / assainissement", sortOrder: 13 },
      { label: "Habillage de fenetre", subCategory: "Nettoyage / assainissement", sortOrder: 14 },
      { label: "Net + rail", subCategory: "Nettoyage / assainissement", sortOrder: 15 },
      { label: "Rideaux + rail", subCategory: "Nettoyage / assainissement", sortOrder: 16 },
      { label: "Table de chevet", subCategory: "Nettoyage / assainissement", sortOrder: 17 },
      { label: "Lampes / Appliques", subCategory: "Nettoyage / assainissement", sortOrder: 18 },
      { label: "Tete de lit", subCategory: "Nettoyage / assainissement", sortOrder: 19 },
      { label: "Tapis", subCategory: "Nettoyage / assainissement", sortOrder: 20 },
      { label: "Plinthes", subCategory: "Nettoyage / assainissement", sortOrder: 21 },
      { label: "Thermostat + regulateur", subCategory: "Nettoyage / assainissement", sortOrder: 22 },
      { label: "Grille de ventilation / radiateur", subCategory: "Nettoyage / assainissement", sortOrder: 23 },
      { label: "Odeur", subCategory: "Nettoyage / assainissement", sortOrder: 24 },
      // Installation / Proprete (26-38)
      { label: "Cintres 5 + 1", subCategory: "Installation / Proprete", sortOrder: 25 },
      { label: "Cendrier", subCategory: "Installation / Proprete", sortOrder: 26 },
      { label: "Oreiller supplementaire", subCategory: "Installation / Proprete", sortOrder: 27 },
      { label: "Linge non froisse (Draps, p / cases, m / housse)", subCategory: "Installation / Proprete", sortOrder: 28 },
      { label: "Couvertures, couettes / couettes propres", subCategory: "Installation / Proprete", sortOrder: 29 },
      { label: "Sous le lit", subCategory: "Installation / Proprete", sortOrder: 30 },
      { label: "Banc + coussin / canape-lit", subCategory: "Installation / Proprete", sortOrder: 31 },
      { label: "Fiche d'information", subCategory: "Installation / Proprete", sortOrder: 32 },
      { label: "Sac a linge et tarif", subCategory: "Installation / Proprete", sortOrder: 33 },
      { label: "Tarif telephone", subCategory: "Installation / Proprete", sortOrder: 34 },
      { label: "TV Chaines", subCategory: "Installation / Proprete", sortOrder: 35 },
      { label: "Enseignes DND / Fiche incendie", subCategory: "Installation / Proprete", sortOrder: 36 },
      { label: "Chambre bien presentee / bien rangee", subCategory: "Installation / Proprete", sortOrder: 37 },
    ],
  },
  {
    name: "Salle de bain - WC",
    checkpoints: [
      // Nettoyage / assainissement (39-63)
      { label: "Fiches / interrupteurs", subCategory: "Nettoyage / assainissement", sortOrder: 0 },
      { label: "Portes (poignees / charnieres)", subCategory: "Nettoyage / assainissement", sortOrder: 1 },
      { label: "Cuvette WC, reservoir et support", subCategory: "Nettoyage / assainissement", sortOrder: 2 },
      { label: "Jante et couvercle WC", subCategory: "Nettoyage / assainissement", sortOrder: 3 },
      { label: "Tuyaux", subCategory: "Nettoyage / assainissement", sortOrder: 4 },
      { label: "Distributeur de papier toilette", subCategory: "Nettoyage / assainissement", sortOrder: 5 },
      { label: "Distributeur d'hygiene", subCategory: "Nettoyage / assainissement", sortOrder: 6 },
      { label: "Baignoire / douche", subCategory: "Nettoyage / assainissement", sortOrder: 7 },
      { label: "tuyau de Douche", subCategory: "Nettoyage / assainissement", sortOrder: 8 },
      { label: "Robinets baignoire / douche", subCategory: "Nettoyage / assainissement", sortOrder: 9 },
      { label: "Extracteur de salle de bain", subCategory: "Nettoyage / assainissement", sortOrder: 10 },
      { label: "Murs / tuiles de douche", subCategory: "Nettoyage / assainissement", sortOrder: 11 },
      { label: "Distributeur de gel douche", subCategory: "Nettoyage / assainissement", sortOrder: 12 },
      { label: "Siphon de douche / Baignoire", subCategory: "Nettoyage / assainissement", sortOrder: 13 },
      { label: "Rideau & rail / Porte de douche", subCategory: "Nettoyage / assainissement", sortOrder: 14 },
      { label: "Bouchon d'evier et dechets", subCategory: "Nettoyage / assainissement", sortOrder: 15 },
      { label: "Robinets d'evier et tuyaux en dessous", subCategory: "Nettoyage / assainissement", sortOrder: 16 },
      { label: "Meuble sous-vasque / Etageres", subCategory: "Nettoyage / assainissement", sortOrder: 17 },
      { label: "Miroir", subCategory: "Nettoyage / assainissement", sortOrder: 18 },
      { label: "Porte serviette", subCategory: "Nettoyage / assainissement", sortOrder: 19 },
      { label: "Eclairage / Appliques", subCategory: "Nettoyage / assainissement", sortOrder: 20 },
      { label: "Murs / Cloison", subCategory: "Nettoyage / assainissement", sortOrder: 21 },
      { label: "Sac poubelle et etat poubelle", subCategory: "Nettoyage / assainissement", sortOrder: 22 },
      { label: "Sol et joints de plancher", subCategory: "Nettoyage / assainissement", sortOrder: 23 },
      { label: "Odeur", subCategory: "Nettoyage / assainissement", sortOrder: 24 },
      // Installation / Proprete (64-68)
      { label: "Papier toilette x 2", subCategory: "Installation / Proprete", sortOrder: 25 },
      { label: "Sac a dechets", subCategory: "Installation / Proprete", sortOrder: 26 },
      { label: "Sous-verres / savon Mercure / verres / gel de douche", subCategory: "Installation / Proprete", sortOrder: 27 },
      { label: "Linge de maison (2 serviettes, 1 tapis de bain...)", subCategory: "Installation / Proprete", sortOrder: 28 },
      { label: "Salle de bain bien presentee / bien rangee", subCategory: "Installation / Proprete", sortOrder: 29 },
    ],
  },
];

// POST /api/audit/templates/demo - Create demo template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { hotelId } = body;

    if (!hotelId) {
      return NextResponse.json({ error: "hotelId requis" }, { status: 400 });
    }

    const template = await prisma.auditTemplate.create({
      data: {
        hotelId,
        name: "Controle Qualite Standard - 68 points",
        description: "Template de controle qualite standard avec 68 points de verification repartis en 2 zones (Zone d'entree et Salle de bain).",
        scoringMode: "BINARY",
        zones: {
          create: DEMO_ZONES.map((zone, zi) => ({
            name: zone.name,
            sortOrder: zi,
            checkpoints: {
              create: zone.checkpoints.map((cp) => ({
                label: cp.label,
                subCategory: cp.subCategory,
                sortOrder: cp.sortOrder,
                weight: 1,
                isBlocking: false,
              })),
            },
          })),
        },
      },
      include: {
        zones: {
          orderBy: { sortOrder: "asc" },
          include: {
            checkpoints: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[AUDIT_DEMO_POST]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
