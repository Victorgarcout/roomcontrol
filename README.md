# RoomControl - Gestion Hoteliere

Application web complete de gestion hoteliere construite avec Next.js 14.

## Stack technique

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend** : Next.js API Routes
- **Base de donnees** : PostgreSQL + Prisma ORM
- **Auth** : NextAuth.js (credentials + Google OAuth)
- **Mailing** : Resend (Nodemailer en fallback)
- **State** : Zustand
- **Formulaires** : React Hook Form + Zod

## Modules

- Auth multi-roles (Super Admin, Admin, Receptionniste, Menage)
- Onboarding hotel (wizard 3 etapes)
- Gestion des chambres (grille/liste, statuts, filtres)
- Reservations (mode rapide + mode avance)
- Dashboard avec KPIs et graphiques
- Planning calendrier
- Rapports et exports CSV
- Controle qualite menage (audits avec 68 points de controle)
- Systeme de mailing automatise

## Installation

### Prerequis

- Node.js 18+
- PostgreSQL (ou Docker)

### 1. Cloner et installer

```bash
git clone <repo-url>
cd roomcontrol
npm install
```

### 2. Configuration

```bash
cp .env.example .env
```

Editez `.env` avec vos informations (base de donnees, NextAuth secret, etc.)

### 3. Base de donnees

Option A - Docker :
```bash
docker-compose up -d
```

Option B - PostgreSQL local : configurez `DATABASE_URL` dans `.env`

### 4. Migrations et seed

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Lancer le serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Comptes de demo

| Role | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | admin@roomcontrol.app | admin123 |
| Receptionniste | reception@roomcontrol.app | reception123 |
| Menage | menage@roomcontrol.app | menage123 |

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run build` | Build production |
| `npm run db:generate` | Generer le client Prisma |
| `npm run db:push` | Pousser le schema vers la BDD |
| `npm run db:migrate` | Creer une migration |
| `npm run db:seed` | Peupler la BDD avec des donnees de demo |
| `npm run db:studio` | Ouvrir Prisma Studio |

## Structure du projet

```
src/
  app/
    (auth)/           # Pages login, register, mot de passe
    (dashboard)/      # Pages principales (dashboard, rooms, bookings...)
    api/              # API Routes
  components/
    ui/               # Composants UI (shadcn)
    layout/           # Sidebar, header, navigation
    bookings/         # Formulaires de reservation
    audit/            # Module qualite menage
  lib/                # Utilitaires (prisma, auth, mail, validations)
  hooks/              # Custom hooks
  stores/             # Zustand stores
  types/              # Types TypeScript
prisma/
  schema.prisma       # Schema de la BDD
  seed.ts             # Donnees de demo
```
