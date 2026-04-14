# ═══════════════════════════════════════════════════════════════════════════
# PROMPT CLAUDE CODE — somnOO Quality
# Intégration complète dans RoomControl existant
# ═══════════════════════════════════════════════════════════════════════════
#
# CONTEXTE :
# - RoomControl est une app Next.js 14 existante (App Router, TypeScript,
#   Prisma 7, NextAuth, Tailwind, shadcn/ui, PostgreSQL via Neon)
# - 13 modèles Prisma, 19 routes API, auth RBAC fonctionnelle
# - On greffe somnOO Quality (9 modules de pilotage qualité hôtelier)
#   directement dans ce repo existant
#
# FICHIERS DE RÉFÉRENCE À LIRE AVANT DE COMMENCER :
# - ARCHITECTURE-SOMNOO.md (vision produit, 9 modules, 4 rôles)
# - somnoo-quality.jsx (maquette React interactive de référence)
# - Le schema.prisma existant du projet
#
# APPROCHE : Exécuter les 4 phases dans l'ordre. Ne pas sauter d'étape.
# Chaque phase se termine par un commit Git avec message conventionnel.
#
# ═══════════════════════════════════════════════════════════════════════════


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 0 — STABILISATION DE ROOMCONTROL                            ║
# ║  Objectif : sécuriser la base avant d'ajouter du code              ║
# ╚═══════════════════════════════════════════════════════════════════════╝

## 0.1 — Rate Limiting

Installer `rate-limiter-flexible` et créer un middleware de rate limiting :

```
src/lib/rate-limit.ts
```

- 10 requêtes / minute sur `/api/auth/register`
- 5 requêtes / minute sur `/api/auth/forgot-password`
- 20 requêtes / minute sur `/api/auth/[...nextauth]` (login)
- Réponse 429 avec header `Retry-After`
- Appliquer le middleware dans chaque route auth existante

## 0.2 — Pagination

Créer un helper de pagination réutilisable :

```
src/lib/pagination.ts
```

```typescript
interface PaginationParams {
  page?: number;    // défaut 1
  limit?: number;   // défaut 20, max 100
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

Appliquer la pagination sur TOUS les endpoints GET qui retournent des listes :
- `/api/rooms` 
- `/api/bookings`
- `/api/guests`
- `/api/audit`
- Tous les futurs endpoints Quality

## 0.3 — Cloudinary

Installer `cloudinary` et `next-cloudinary`.

```
src/lib/cloudinary.ts
```

- Configurer avec les variables d'env : `CLOUDINARY_CLOUD_NAME`, 
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Créer un endpoint générique d'upload :

```
src/app/api/upload/route.ts
```

- Accepte multipart/form-data
- Validation : images uniquement (jpeg, png, webp), max 10 Mo
- Upload vers Cloudinary dans le dossier `somnoo/{hotelId}/{type}/`
  où type = "audits", "rooms", "safety", "logos"
- Retourne `{ url, publicId, width, height }`
- Middleware auth requis (tout rôle connecté)

Ajouter les variables d'env dans `.env.example` :

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 0.4 — Tests de base

Installer Vitest + @testing-library/react :

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
```

Créer `vitest.config.ts` à la racine.

Écrire au minimum ces tests :
- `src/lib/__tests__/pagination.test.ts` — tester le helper pagination
- `src/lib/__tests__/rate-limit.test.ts` — tester le rate limiter
- `src/app/api/auth/__tests__/register.test.ts` — tester le register (succès + doublon email + champs manquants)

Ajouter dans `package.json` :
```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

## 0.5 — Commit Phase 0

```bash
git add .
git commit -m "fix: stabilize base — rate limiting, pagination, cloudinary, tests

- Add rate-limiter-flexible on auth endpoints (429 protection)
- Add pagination helper + apply on all GET list endpoints
- Add Cloudinary upload endpoint (images, 10Mo max)
- Add Vitest + initial test suite (pagination, rate-limit, register)
- Add .env.example with Cloudinary vars"
```


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 1 — MODÈLES PRISMA QUALITY                                  ║
# ║  Objectif : étendre le schema avec les 8+ nouveaux modèles         ║
# ╚═══════════════════════════════════════════════════════════════════════╝

## 1.1 — Mise à jour de l'enum Role

Modifier l'enum `Role` existant dans `schema.prisma` :

```prisma
enum Role {
  SUPER_ADMIN         // Siège somnOO — vue consolidée tous hôtels
  ADMIN               // GM — accès complet à son hôtel
  OPE_HEBERGEMENT     // DM, réception, gouvernante
  OPE_TECHNIQUE       // Technicien, maintenance
}
```

ATTENTION : si des données existent en base avec les anciens noms 
(RECEPTIONNISTE, MENAGE…), créer une migration de données SQL 
dans le fichier de migration Prisma pour les mettre à jour :

```sql
UPDATE "HotelUser" SET role = 'OPE_HEBERGEMENT' WHERE role = 'RECEPTIONNISTE';
UPDATE "HotelUser" SET role = 'OPE_TECHNIQUE' WHERE role = 'MENAGE';
```

## 1.2 — Nouveaux modèles Prisma

Ajouter les modèles suivants au `schema.prisma` existant.
Respecter les conventions déjà en place (nommage, relations, timestamps).

```prisma
// ═══════════════════════════════════════
// PERFORMANCE (TrustYou)
// ═══════════════════════════════════════

model MonthlyPerf {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  year        Int
  month       Int      // 1-12
  rps         Float?
  rpsN1       Float?
  compIndex   Float?
  nbReviews   Int?
  responseRate Float?
  negImpact1  String?
  negImpact2  String?
  negImpact3  String?
  posImpact1  String?
  posImpact2  String?
  posImpact3  String?
  sparkles    Int?
  animations  Int?
  comments    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([hotelId, year, month])
}

// ═══════════════════════════════════════
// PLAN D'ACTION
// ═══════════════════════════════════════

enum ActionStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum ActionCategory {
  CHAMBRE
  PROPRETE
  EQUIPEMENT
  MAINTENANCE
}

model ActionPlan {
  id          String         @id @default(cuid())
  hotelId     String
  hotel       Hotel          @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  category    ActionCategory
  score       Float?         // score impact TrustYou
  text        String
  dueDate     DateTime?
  owner       String         // initiales ou nom du responsable
  status      ActionStatus   @default(TODO)
  budget      Float?
  comment     String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

// ═══════════════════════════════════════
// RITUELS
// ═══════════════════════════════════════

model RitualCheck {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  ritualId    String   // ex: "trustyou", "reunion", "avis"…
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  weekStart   DateTime // lundi de la semaine
  done        Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@unique([hotelId, ritualId, weekStart])
}

// ═══════════════════════════════════════
// SUIVI TECHNIQUE — ÉQUIPEMENTS CHAMBRES
// ═══════════════════════════════════════

enum EquipmentState {
  BON
  DEGRADE
  HS
}

model RoomEquipCheck {
  id          String          @id @default(cuid())
  hotelId     String
  hotel       Hotel           @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  roomNumber  String
  checkDate   DateTime
  equipStates Json            // { "TV": "BON", "Joints SDB": "DEGRADE", ... }
  action      String?
  status      ActionStatus    @default(TODO)
  checkedBy   String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

// ═══════════════════════════════════════
// SUIVI TECHNIQUE — PARTIES COMMUNES
// ═══════════════════════════════════════

model CommonAreaCheck {
  id          String       @id @default(cuid())
  hotelId     String
  hotel       Hotel        @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  areaName    String       // "Lobby", "Couloirs étages"…
  checkDate   DateTime
  checkStates Json         // { "Peinture": "BON", "Sols": "DEGRADE" }
  action      String?
  status      ActionStatus @default(TODO)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

// ═══════════════════════════════════════
// MAINTENANCE QUOTIDIENNE (TICKETS)
// ═══════════════════════════════════════

enum TicketPriority {
  HAUTE
  MOYENNE
  FAIBLE
}

enum TicketStatus {
  A_FAIRE
  EN_COURS
  TERMINE
}

model MaintenanceTicket {
  id          String         @id @default(cuid())
  hotelId     String
  hotel       Hotel          @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  date        DateTime       @default(now())
  zone        String         // "Ch. 102", "Cuisine"…
  equipment   String
  problem     String
  priority    TicketPriority @default(MOYENNE)
  status      TicketStatus   @default(A_FAIRE)
  cost        Float?
  assignedTo  String?        // userId du technicien
  photos      String[]       // URLs Cloudinary
  comments    String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

// ═══════════════════════════════════════
// MAINTENANCE FOURNISSEURS / RÉGLEMENTAIRE
// ═══════════════════════════════════════

model SupplierMaint {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  equipment   String   // "Chaufferie", "Ascenseur"…
  lastCheck   DateTime?
  frequency   String   // "Mensuelle", "Trimestrielle", "Annuelle"…
  supplier    String?
  reserves    String?
  quotation   Float?
  documents   String[] // URLs Cloudinary (PV, rapports)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ═══════════════════════════════════════
// COMMISSION DE SÉCURITÉ
// ═══════════════════════════════════════

enum SafetyStatus {
  CONFORME
  RESERVE
  EN_COURS
  EXPIRE
}

model SafetyItem {
  id          String       @id @default(cuid())
  hotelId     String
  hotel       Hotel        @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  category    String       // "moyens_secours", "controles", "formations"
  label       String       // "Extincteurs", "SSI"…
  lastCheck   DateTime?
  frequency   String       // "Annuelle", "Trimestrielle"…
  status      SafetyStatus @default(EXPIRE)
  documents   String[]     // PV, rapports
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model SafetyCommission {
  id             String   @id @default(cuid())
  hotelId        String
  hotel          Hotel    @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  visitDate      DateTime
  result         String   // "favorable", "defavorable", "favorable_avec_reserves"
  prescriptions  Json     // [{ text, resolved, resolvedDate }]
  nextVisitDate  DateTime?
  pvDocument     String?  // URL Cloudinary
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// ═══════════════════════════════════════
// AUDIT GLOBAL HÔTEL (trimestriel)
// ═══════════════════════════════════════

model HotelAudit {
  id          String           @id @default(cuid())
  hotelId     String
  hotel       Hotel            @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  auditDate   DateTime
  auditorId   String
  auditor     User             @relation(fields: [auditorId], references: [id])
  globalScore Float?           // calculé : moyenne pondérée
  items       HotelAuditItem[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model HotelAuditItem {
  id          String     @id @default(cuid())
  auditId     String
  audit       HotelAudit @relation(fields: [auditId], references: [id], onDelete: Cascade)
  zone        String     // "ext", "lobby", "recep"…
  item        String     // "Signalétique", "Parking"…
  score       Int        // 1-4 (Non conforme → Excellent)
  comment     String?
  photos      String[]   // URLs Cloudinary
}

// ═══════════════════════════════════════
// PLAYBOOK CUSTOM (propositions équipe)
// ═══════════════════════════════════════

model PlaybookCustom {
  id          String   @id @default(cuid())
  hotelId     String
  hotel       Hotel    @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  type        String   // "event", "season_summer", "season_winter", "season_all", "boost"
  title       String
  description String?
  effort      String?  // "low", "med", "high" (pour boosts)
  createdBy   String
  createdAt   DateTime @default(now())
}
```

## 1.3 — Relations dans le modèle Hotel existant

Ajouter les relations dans le modèle `Hotel` existant :

```prisma
model Hotel {
  // ... champs existants ...

  // Relations Quality
  monthlyPerfs      MonthlyPerf[]
  actionPlans       ActionPlan[]
  ritualChecks      RitualCheck[]
  roomEquipChecks   RoomEquipCheck[]
  commonAreaChecks  CommonAreaCheck[]
  maintenanceTickets MaintenanceTicket[]
  supplierMaints    SupplierMaint[]
  safetyItems       SafetyItem[]
  safetyCommissions SafetyCommission[]
  hotelAudits       HotelAudit[]
  playbookCustoms   PlaybookCustom[]
}
```

Ajouter dans le modèle `User` existant :

```prisma
model User {
  // ... champs existants ...

  ritualChecks  RitualCheck[]
  hotelAudits   HotelAudit[]
}
```

## 1.4 — Migration

```bash
npx prisma migrate dev --name add_quality_modules
npx prisma generate
```

Vérifier que la migration s'applique sans erreur.
Vérifier que les modèles existants n'ont pas été altérés.

## 1.5 — Commit Phase 1

```bash
git add .
git commit -m "feat: add somnOO Quality data models

- Extend Role enum (OPE_HEBERGEMENT, OPE_TECHNIQUE)
- Add 12 new Prisma models for Quality modules
- MonthlyPerf, ActionPlan, RitualCheck
- RoomEquipCheck, CommonAreaCheck, MaintenanceTicket, SupplierMaint
- SafetyItem, SafetyCommission, HotelAudit, HotelAuditItem
- PlaybookCustom
- Add relations to existing Hotel and User models
- Migration applied successfully"
```


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 2 — ROUTES API QUALITY                                      ║
# ║  Objectif : créer les endpoints pour chaque module                  ║
# ╚═══════════════════════════════════════════════════════════════════════╝

## Conventions à respecter (copiées de l'existant RC)

- Chaque route est dans `src/app/api/quality/[module]/route.ts`
- Middleware auth via `getServerSession(authOptions)`
- Validation des inputs avec Zod
- Réponses paginées via le helper Phase 0
- Filtrage par `hotelId` systématique (RBAC)
- Gestion d'erreurs avec try/catch + NextResponse.json({ error }, { status })

## 2.1 — Middleware RBAC Quality

Créer un helper :

```
src/lib/quality-auth.ts
```

```typescript
// Vérifie que l'utilisateur a accès au module pour cet hôtel
// Retourne { user, hotelUser, role } ou throw 403
export async function requireQualityAccess(
  hotelId: string,
  allowedRoles: Role[],
) { ... }
```

Matrice d'accès (depuis l'architecture validée) :

| Module             | SUPER | ADMIN | OPE_HEBERG | OPE_TECH |
|--------------------|-------|-------|------------|----------|
| performance        |  RW   |  RW   |     R      |    —     |
| actions            |  RW   |  RW   |     RW*    |    —     |
| rituals            |  RW   |  RW   |     RW     |    —     |
| maintenance-tickets|  RW   |  RW   |     W      |   RW     |
| room-equip         |  RW   |  RW   |     —      |   RW     |
| common-areas       |  RW   |  RW   |     —      |   RW     |
| suppliers          |  RW   |  RW   |     —      |   RW     |
| safety             |  RW   |  RW   |     —      |    R     |
| hotel-audit        |  RW   |  RW   |     —      |    —     |
| room-inspection    |  RW   |  RW   |     RW     |    —     |
| playbook           |  RW   |  RW   |     R      |    —     |

R = lecture, W = écriture, RW* = écriture limitée (statut seulement)

## 2.2 — Routes à créer

Créer chaque fichier de route. Pour chaque module, implémenter GET 
(liste paginée + filtres) et POST (création) au minimum, 
PATCH (mise à jour) et DELETE quand pertinent.

```
src/app/api/quality/
├── performance/
│   └── route.ts              GET (list by hotelId+year), POST, PATCH
├── actions/
│   ├── route.ts              GET (list, filtres status/category), POST
│   └── [id]/route.ts         GET, PATCH, DELETE
├── rituals/
│   └── route.ts              GET (by hotelId+weekStart), POST (toggle)
├── maintenance/
│   ├── tickets/
│   │   ├── route.ts          GET (filtres priority/status), POST
│   │   └── [id]/route.ts     PATCH (status, assign, comment)
│   ├── room-equip/
│   │   ├── route.ts          GET (by hotelId), POST
│   │   └── [id]/route.ts     PATCH
│   ├── common-areas/
│   │   ├── route.ts          GET, POST
│   │   └── [id]/route.ts     PATCH
│   └── suppliers/
│       ├── route.ts          GET, POST
│       └── [id]/route.ts     PATCH
├── safety/
│   ├── items/
│   │   ├── route.ts          GET, POST
│   │   └── [id]/route.ts     PATCH
│   └── commissions/
│       ├── route.ts          GET, POST
│       └── [id]/route.ts     PATCH
├── audit/
│   ├── route.ts              GET (list audits by hotel), POST (create audit)
│   └── [id]/route.ts         GET (full audit with items), PATCH
├── inspections/
│   ├── route.ts              GET (by hotel+date), POST (create inspection)
│   └── [id]/route.ts         GET
├── playbook/
│   ├── route.ts              GET (customs by hotel), POST
│   └── [id]/route.ts         DELETE
└── hub/
    └── route.ts              GET (dashboard agrégé pour le Hub)
```

## 2.3 — Endpoint Hub (agrégation dashboard)

Le endpoint `/api/quality/hub` retourne en une seule requête :

```typescript
{
  hotel: { name, city, rooms },
  kpis: {
    actionsDone: number,
    actionsTotal: number,
    ritualsDone: number,  // cette semaine
    ritualsTotal: number,
    totalAlerts: number,
    currentRps: number | null,
  },
  latestPerf: MonthlyPerf | null,    // dernier mois renseigné
  urgentActions: ActionPlan[],        // status TODO, max 4
  nextEvents: PlaybookCustom[],       // prochains événements custom
  alerts: {
    urgentTickets: number,
    lateSuppliers: number,
    lateRoomChecks: number,
  }
}
```

## 2.4 — Validation Zod

Créer un fichier central de schémas :

```
src/lib/quality-schemas.ts
```

Un schéma Zod par endpoint POST/PATCH. Exemples :

```typescript
export const createActionSchema = z.object({
  hotelId: z.string().cuid(),
  category: z.enum(["CHAMBRE", "PROPRETE", "EQUIPEMENT", "MAINTENANCE"]),
  text: z.string().min(1).max(500),
  dueDate: z.string().datetime().optional(),
  owner: z.string().min(1).max(50),
  score: z.number().optional(),
  budget: z.number().optional(),
});

export const toggleRitualSchema = z.object({
  hotelId: z.string().cuid(),
  ritualId: z.string(),
  weekStart: z.string().datetime(),
  done: z.boolean(),
});

export const createTicketSchema = z.object({
  hotelId: z.string().cuid(),
  zone: z.string().min(1),
  equipment: z.string().min(1),
  problem: z.string().min(1),
  priority: z.enum(["HAUTE", "MOYENNE", "FAIBLE"]),
  cost: z.number().optional(),
  photos: z.array(z.string().url()).optional(),
});
```

## 2.5 — Commit Phase 2

```bash
git add .
git commit -m "feat: add somnOO Quality API routes

- Add RBAC middleware for quality modules (role-based access matrix)
- Add 25+ API endpoints across 11 quality modules
- Add Zod validation schemas for all inputs
- All endpoints paginated via shared helper
- Hub aggregation endpoint for dashboard KPIs
- Full CRUD for actions, tickets, audits, safety items"
```


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 3 — PAGES FRONTEND QUALITY                                  ║
# ║  Objectif : intégrer les écrans dans l'App Router existant          ║
# ╚═══════════════════════════════════════════════════════════════════════╝

## 3.1 — Structure des pages

Créer les pages dans l'App Router existant sous un groupe `(quality)` :

```
src/app/(quality)/
├── layout.tsx                 ← Layout Quality avec bottom nav 5 onglets
├── hub/page.tsx               ← Hub / Dashboard
├── chambres/page.tsx          ← Contrôle chambres (rapide + avancé)
├── actions/page.tsx           ← Plan d'action
├── rituels/page.tsx           ← Rituels qualité
├── technique/page.tsx         ← Suivi technique (4 sous-onglets)
├── performance/page.tsx       ← Performance TrustYou
├── playbook/page.tsx          ← Animations, saisons, boosters
├── audit/page.tsx             ← Audit global hôtel
├── audit/[id]/page.tsx        ← Détail d'un audit
├── securite/page.tsx          ← Commission de sécurité
└── securite/[id]/page.tsx     ← Détail d'une commission
```

## 3.2 — Layout Quality

Le layout `(quality)/layout.tsx` :

- Contient la bottom navigation (5 onglets : Hub, Chambres, Actions, 
  Rituels, Technique) avec icônes Lucide
- Barre de navigation supérieure avec bouton retour "← Hub" 
  sur les sous-pages (Performance, Playbook, Audit, Sécurité)
- Branding somnOO : palette navy (#1B2A4A) + sable (#C8A96E), 
  font Outfit
- Max-width 480px centré (mobile-first)
- Les composants UI existants (shadcn/ui) sont réutilisés 
  autant que possible
- Le toast notification est géré via un provider Zustand

## 3.3 — Composants Quality partagés

Créer les composants réutilisables dans :

```
src/components/quality/
├── KPI.tsx                    ← Carte KPI avec icône + valeur + label
├── NoteButton.tsx             ← Bouton de notation standardisé (32x28px)
├── ProgressBar.tsx            ← Barre de progression
├── Tag.tsx                    ← Badge/tag coloré
├── Pill.tsx                   ← Pill filtres avec compteur
├── SectionLabel.tsx           ← Titre de section uppercase
├── EmptyState.tsx             ← État vide avec icône + message
├── AlertBanner.tsx            ← Bandeau d'alerte cliquable
├── DateInput.tsx              ← Input date natif stylé
└── QualityCard.tsx            ← Card stylée Quality (border-left accent)
```

Design tokens à centraliser dans :

```
src/lib/quality-theme.ts
```

```typescript
export const Q = {
  borderAccent: 3,      // largeur border-left accent
  cardRadius: 14,       // border-radius cartes
  noteBtn: { w: 32, h: 28, r: 8 },  // boutons notation
  colors: {
    navy: "#1B2A4A",
    sand: "#C8A96E",
    // ... palette complète
  }
};
```

## 3.4 — Data fetching

Utiliser le pattern SWR ou React Query (selon ce qui est déjà 
en place dans RC) pour le data fetching côté client.

Créer des hooks custom :

```
src/hooks/quality/
├── useQualityHub.ts           ← fetch /api/quality/hub
├── useActions.ts              ← CRUD actions
├── useRituals.ts              ← toggle rituels
├── useMaintenanceTickets.ts   ← CRUD tickets
├── usePerformance.ts          ← CRUD monthly perf
├── useAudit.ts                ← CRUD audits
├── useSafety.ts               ← CRUD safety items
└── usePlaybook.ts             ← CRUD playbook customs
```

Chaque hook :
- Gère le loading state
- Gère les erreurs
- Déclenche le toast via le store Zustand
- Invalide le cache après mutation

## 3.5 — Intégration des pages

Pour chaque page, s'appuyer sur la maquette `somnoo-quality.jsx` 
comme référence visuelle, mais :

- Remplacer les inline styles par Tailwind CSS + composants shadcn/ui
- Remplacer les données hardcodées par les hooks de data fetching
- Ajouter les date pickers natifs (déjà fait dans la maquette)
- Ajouter les toasts de confirmation (déjà fait dans la maquette)
- Ajouter les empty states quand les listes sont vides
- Respecter la matrice RBAC : masquer les modules non autorisés 
  selon le rôle de l'utilisateur connecté

## 3.6 — Adaptations selon le rôle

Dans le layout Quality, filtrer les onglets affichés :

```typescript
const visibleTabs = NAV_TABS.filter(tab => {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
  if (role === "OPE_HEBERGEMENT") return ["hub","chambres","actions","rituals"].includes(tab.id);
  if (role === "OPE_TECHNIQUE") return ["hub","tech"].includes(tab.id);
  return false;
});
```

Dans le Hub, filtrer les cartes "Accès rapide" de la même manière.

## 3.7 — Commit Phase 3

```bash
git add .
git commit -m "feat: add somnOO Quality frontend pages

- Add (quality) route group with layout + bottom nav
- Add 10 pages: Hub, Chambres, Actions, Rituels, Technique,
  Performance, Playbook, Audit, Sécurité
- Add 10 shared Quality components (KPI, NoteButton, etc.)
- Add quality-theme.ts design tokens
- Add 8 data fetching hooks
- RBAC-aware navigation (tabs filtered by role)
- Mobile-first, max-width 480px, Outfit font"
```


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  PHASE 4 — TRUSTYOU + NOTIFICATIONS                                ║
# ║  Objectif : automatiser la collecte de données et les alertes       ║
# ╚═══════════════════════════════════════════════════════════════════════╝

## 4.1 — TrustYou Connect API

Créer le service d'intégration :

```
src/lib/trustyou.ts
```

- Authentification via API key (variable d'env `TRUSTYOU_API_KEY`)
- Endpoint de base : `https://api.trustyou.com/`
- Fonction `fetchHotelMetrics(trustyouHotelId)` qui récupère :
  - TrustScore (= RPS)
  - Response rate
  - Review count
  - Sentiment categories (top 3 positifs + top 3 négatifs avec scores)
- Mapping vers le modèle `MonthlyPerf`

Ajouter un champ `trustyouId` au modèle `Hotel` :

```prisma
model Hotel {
  // ... existant ...
  trustyouId  String?    // ID TrustYou pour l'API Connect
}
```

## 4.2 — Cron job (Vercel Cron)

Créer un endpoint cron :

```
src/app/api/cron/trustyou-sync/route.ts
```

- Exécuté chaque lundi à 6h (configurable)
- Pour chaque hôtel ayant un `trustyouId` :
  - Appelle l'API TrustYou
  - Crée ou met à jour le `MonthlyPerf` du mois en cours
- Log les résultats dans la console Vercel
- Protection par `CRON_SECRET` (header `Authorization`)

Ajouter dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/trustyou-sync",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

Variables d'env à ajouter :

```
TRUSTYOU_API_KEY=
CRON_SECRET=
```

## 4.3 — Web Push Notifications

Installer `web-push` :

```bash
npm install web-push
```

Créer le service :

```
src/lib/web-push.ts
```

- Générer les clés VAPID (une seule fois, stocker dans .env)
- Ajouter un modèle `PushSubscription` :

```prisma
model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint    String   @unique
  p256dh      String
  auth        String
  createdAt   DateTime @default(now())
}
```

Endpoints :

```
src/app/api/push/
├── subscribe/route.ts       POST — enregistrer une souscription
├── unsubscribe/route.ts     POST — supprimer une souscription
└── send/route.ts            POST — envoyer une notification (interne)
```

Service worker (pour PWA) :

```
public/sw.js
```

Notifications déclenchées pour :
- Ticket maintenance priorité HAUTE créé → OPE_TECHNIQUE
- Rituel non validé vendredi 17h → ADMIN + OPE_HEBERGEMENT
- Fournisseur en retard de contrôle → ADMIN
- Rappel audit trimestriel (J-7) → ADMIN + SUPER_ADMIN
- Commission de sécurité : réserve non levée > 30j → ADMIN

## 4.4 — Alertes email automatiques

Créer un endpoint cron pour les alertes email :

```
src/app/api/cron/quality-alerts/route.ts
```

- Exécuté chaque jour à 8h
- Vérifie pour chaque hôtel :
  - Tickets HAUTE + A_FAIRE non traités depuis > 48h
  - Fournisseurs en retard de contrôle
  - Rituels non complétés en fin de semaine (vendredi)
  - Audit trimestriel en retard
- Envoie un email récapitulatif via Resend au GM (ADMIN)

Templates email React (dans `src/emails/`) :
- `quality-alert.tsx` — récap des alertes du jour
- `audit-reminder.tsx` — rappel audit trimestriel
- `weekly-rituals.tsx` — résumé rituels de la semaine

Ajouter dans `vercel.json` :

```json
{
  "crons": [
    { "path": "/api/cron/trustyou-sync", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/quality-alerts", "schedule": "0 8 * * *" }
  ]
}
```

## 4.5 — Commit Phase 4

```bash
git add .
git commit -m "feat: add TrustYou integration + notifications

- Add TrustYou Connect API service (auto-sync RPS, reviews, sentiments)
- Add Vercel Cron job for weekly TrustYou sync
- Add Web Push notifications (VAPID, service worker, subscription)
- Add daily quality alerts email via Resend
- Add 3 React Email templates (alerts, audit reminder, weekly rituals)
- Notification triggers: urgent tickets, late suppliers, ritual reminders
- Add trustyouId field to Hotel model
- Add PushSubscription model"
```


# ╔═══════════════════════════════════════════════════════════════════════╗
# ║  POST-DÉPLOIEMENT — VÉRIFICATIONS                                  ║
# ╚═══════════════════════════════════════════════════════════════════════╝

```bash
# Build de vérification
npm run build

# Tests
npm run test:run

# Push
git push origin main

# Déploiement
vercel --prod
```

## Checklist post-déploiement

- [ ] Les 19 routes API existantes fonctionnent toujours
- [ ] Les 25+ nouvelles routes Quality répondent correctement
- [ ] Les rôles RBAC filtrent bien les accès
- [ ] La bottom nav affiche les bons onglets selon le rôle
- [ ] Le Hub charge les KPIs agrégés sans erreur
- [ ] Les toasts s'affichent après chaque action
- [ ] Les date pickers natifs fonctionnent sur iOS et Android
- [ ] Cloudinary upload fonctionne (tester avec une photo d'audit)
- [ ] Les cron jobs TrustYou et alertes sont enregistrés dans Vercel
- [ ] Les notifications push arrivent sur Chrome mobile
- [ ] Le PWA s'installe correctement ("Ajouter à l'écran d'accueil")
- [ ] La base PostgreSQL (Neon) a bien les 25 tables attendues

## Variables d'environnement complètes

```
# Existantes (RoomControl)
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
MAIL_FROM=

# Phase 0
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Phase 4
TRUSTYOU_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_VAPID_KEY=
VAPID_PRIVATE_KEY=
```
