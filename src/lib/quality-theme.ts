// ── somnOO Quality Design Tokens ─────────────────────────────────────
export const Q = {
  borderAccent: 3,
  cardRadius: 14,
  noteBtn: { w: 32, h: 28, r: 8 },
  colors: {
    navy: "#1B2A4A",
    navy2: "#253759",
    sand: "#C8A96E",
    sand2: "#D4BC8A",
    sandA: "rgba(200,169,110,0.10)",
    sandB: "rgba(200,169,110,0.20)",
    bg: "#F5F3EE",
    card: "#FFFFFF",
    warm: "#E8E4DD",
    t1: "#1B2A4A",
    t2: "#5E6B80",
    t3: "#8E96A4",
    b1: "#E2DDD5",
    b2: "#EDE9E3",
    ok: "#16A34A",
    okA: "rgba(22,163,74,0.08)",
    okB: "rgba(22,163,74,0.14)",
    warn: "#D97706",
    warnA: "rgba(217,119,6,0.08)",
    warnB: "rgba(217,119,6,0.14)",
    err: "#DC2626",
    errA: "rgba(220,38,38,0.08)",
    errB: "rgba(220,38,38,0.14)",
    info: "#7C3AED",
    teal: "#0D9488",
    tealB: "rgba(13,148,136,0.14)",
  },
} as const;

export const MONTHS_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

// ── RITUALS reference data ──
export const RITUALS = [
  { id: "trustyou", label: "Récolte données TrustYou", freq: "Hebdo" },
  { id: "reunion", label: "Réunion qualité équipes", freq: "Hebdo" },
  { id: "avis", label: "Réponse 100% avis clients", freq: "Hebdo" },
  { id: "maintenance", label: "Contrôle Plan Maintenance", freq: "Hebdo" },
  { id: "perso", label: "Personnalisation séjours", freq: "Hebdo" },
  { id: "chambres", label: "Contrôle des chambres", freq: "Quotidien" },
  { id: "incentive", label: "Incentive satisfaction", freq: "Trimestriel" },
  { id: "animation", label: "Animations clients", freq: "Mensuel" },
  { id: "saison", label: "Actions haute saison", freq: "Biannuel" },
  { id: "qrcode", label: "QR Code / NFC", freq: "Constant" },
  { id: "pa", label: "Mise à jour Plan d'Action", freq: "Bi-mensuel" },
];

// ── ROOM EQUIPMENT items ──
export const ROOM_EQUIPMENT = [
  "TV/Télécommande", "Ampoules", "Joints SDB", "Peinture",
  "Sols", "Robinetterie", "WC", "Rideaux", "Menuiseries",
];

// ── AUDIT ZONES ──
export const AUDIT_ZONES = [
  { id: "ext", name: "Extérieurs", items: ["Signalétique", "Parking", "Façade", "Éclairage", "Propreté", "Espaces verts", "Terrasse"] },
  { id: "lobby", name: "Accueil", items: ["1ère impression", "Propreté", "Odeur", "Éclairage", "Mobilier", "Affichage", "Documentation", "Musique"] },
  { id: "recep", name: "Réception", items: ["Rapidité", "Sourire", "Tenue", "Connaissance", "Upsell", "Check-in"] },
  { id: "couloirs", name: "Couloirs", items: ["Propreté", "Éclairage", "Signalétique", "Sol", "Peinture", "Coupe-feu", "Issues"] },
  { id: "chambre", name: "Chambre", items: ["Propreté", "Literie", "SDB", "Équipements", "Consommables", "Doc.", "TV/clim"] },
  { id: "fb", name: "F&B", items: ["Buffet", "Fraîcheur", "Présentation", "Salle", "Service", "Horaires", "Vaisselle"] },
  { id: "communs", name: "Communs", items: ["Séminaire", "Fitness", "Ascenseur", "Escaliers", "Buanderie"] },
  { id: "secu", name: "Sécurité", items: ["Extincteurs", "Issues", "Affichage", "Registre"] },
];

// ── SAFETY CATEGORIES ──
export const SAFETY_CATEGORIES = [
  { id: "moyens", name: "Moyens secours", items: [
    { label: "Extincteurs", freq: "Annuelle" },
    { label: "RIA / colonnes sèches", freq: "Annuelle" },
    { label: "BAES", freq: "Annuelle" },
    { label: "SSI", freq: "Trimestrielle" },
    { label: "Désenfumage", freq: "Annuelle" },
    { label: "Plans évacuation", freq: "Annuelle" },
  ]},
  { id: "controles", name: "Contrôles réglem.", items: [
    { label: "Électricité", freq: "Annuelle" },
    { label: "Gaz", freq: "Annuelle" },
    { label: "Ascenseur annuel", freq: "Annuelle" },
    { label: "Ascenseur quinquennal", freq: "Quinquennale" },
    { label: "Commission sécurité", freq: "Tri-annuelle" },
    { label: "Amiante/plomb", freq: "Annuelle" },
  ]},
  { id: "formations", name: "Formations", items: [
    { label: "Incendie équipiers", freq: "Annuelle" },
    { label: "Évacuation", freq: "Semestrielle" },
    { label: "SST", freq: "Annuelle" },
  ]},
];

// ── PLAYBOOK EVENTS ──
export const PLAYBOOK_EVENTS = [
  { m: 0, d: 1, name: "Jour de l'An", type: "deco", tip: "Décoration hôtel" },
  { m: 0, d: 6, name: "Épiphanie", type: "food", tip: "Galette des rois" },
  { m: 1, d: 2, name: "Chandeleur", type: "food", tip: "Crêpes à l'arrivée" },
  { m: 1, d: 14, name: "Saint-Valentin", type: "deco", tip: "Déco + package" },
  { m: 2, d: 17, name: "Saint-Patrick", type: "event", tip: "Soirée bière" },
  { m: 3, d: 5, name: "Pâques", type: "food", tip: "Brunch, chocolat" },
  { m: 4, d: 1, name: "Fête du travail", type: "deco", tip: "Muguet" },
  { m: 5, d: 11, name: "FIFA 2026", type: "event", tip: "Diffusion matchs" },
  { m: 5, d: 21, name: "Fête musique", type: "event", tip: "Concert, blind test" },
  { m: 6, d: 14, name: "14 Juillet", type: "food", tip: "Barbecue" },
  { m: 8, d: 19, name: "Oktoberfest", type: "event", tip: "Bière + bretzels" },
  { m: 9, d: 31, name: "Halloween", type: "deco", tip: "Déco + bonbons" },
  { m: 10, d: 19, name: "Beaujolais", type: "food", tip: "Dégustation" },
  { m: 11, d: 24, name: "Noël", type: "deco", tip: "Vin chaud, fondue" },
  { m: 11, d: 31, name: "Réveillon", type: "event", tip: "Soirée spéciale" },
];

export const PLAYBOOK_BOOSTS = [
  { text: "Tombola quotidienne commentaires 5★", effort: "low" as const },
  { text: "Roue à jeux avec récompenses", effort: "med" as const },
  { text: "QR code Google à la réception", effort: "low" as const },
  { text: "Mot d'accueil Booking + relance", effort: "low" as const },
  { text: "Café + viennoiserie pendant commentaire", effort: "med" as const },
  { text: "1000 pts IHG / commentaire nominatif", effort: "high" as const },
  { text: "Prime par commentaire nominatif", effort: "high" as const },
];

export const PLAYBOOK_SEASONS = {
  summer: [
    "Jarre boissons rafraîchissantes", "Fleurir extérieurs", "Goodies été",
    "Check maintenance clim", "Anticiper ventilateurs", "Check global maintenance",
    "Aménager extérieurs (ping-pong, pétanque)",
  ],
  winter: [
    "Vin chaud / chocolat chaud", "Bougies LED, sapin, déco chalet", "Goodies hiver",
    "Check chauffage avant saison", "Anticiper convecteurs / plaids",
  ],
  allYear: [
    "Surclassement offert à l'arrivée", "Mot personnalisé en chambre",
    "Marchés artisans locaux", "Animations (concerts…)", "Goûter enfants + jeux",
  ],
};
