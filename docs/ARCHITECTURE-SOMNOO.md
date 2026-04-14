
# somnOO Quality — Architecture
## Plateforme de pilotage qualité & opérations hôtelières

---

## 1. VISION PRODUIT

**somnOO Quality** — une seule application pour piloter la qualité, 
les opérations et la maintenance de l'ensemble du parc somnOO (65+ hôtels).

RoomControl + Quality Pilot fusionnent en une plateforme unique 
avec des vues adaptées selon le rôle de l'utilisateur.

---

## 2. RÔLES & PÉRIMÈTRES

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SUPER_ADMIN (Siège somnOO)                                    │
│  ├── Vue consolidée tous hôtels (comparatifs, classements)     │
│  ├── Paramétrage global (grilles, templates, fréquences)       │
│  ├── Gestion des comptes, hôtels & droits                     │
│  ├── Audit global hôtel (trimestriel)                          │
│  └── Accès complet à tous les modules de chaque hôtel          │
│                                                                 │
│  ADMIN (GM / Directeur d'hôtel)                                │
│  ├── Accès COMPLET à son hôtel uniquement                      │
│  ├── Hub, Performance, Plan d'action, Rituels, Playbook        │
│  ├── Suivi technique complet                                   │
│  ├── Contrôle chambres + Audit global                          │
│  └── Gestion des utilisateurs de son hôtel                     │
│                                                                 │
│  OPE_HEBERGEMENT (DM, Réception, Gouvernante)                  │
│  ├── Hub (son hôtel)                                           │
│  ├── Contrôle chambres (quotidien, rapide + avancé)            │
│  ├── Rituels (consultation + validation)                       │
│  ├── Plan d'action (mise à jour statuts uniquement)            │
│  ├── Maintenance quotidienne (créer des tickets)               │
│  └── Playbook (lecture)                                        │
│                                                                 │
│  OPE_TECHNIQUE (Technicien, Maintenance)                       │
│  ├── Hub simplifié (ses tickets + alertes)                     │
│  ├── Suivi technique chambres (état équipements)               │
│  ├── Suivi parties communes                                    │
│  ├── Maintenance quotidienne (ses tickets assignés)            │
│  ├── Maintenance fournisseurs / réglementaire                  │
│  └── Commentaires horodatés par ticket                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. MODULES DE L'APPLICATION

### 3.1 — HUB (Accueil)

Page centrale, adaptée au rôle :

**Vue ADMIN (GM) :**
- Identité hôtel + objectif RPS + jauge
- 4 KPIs : Actions, Rituels, Alertes tech, RPS
- Évolution RPS (graphique)
- Indicateurs du mois (CompIndex, avis, taux réponse, deltas)
- Impacts TrustYou (négatifs/positifs)
- Actions prioritaires (non terminées)
- Prochaines animations
- Alertes maintenance urgentes

**Vue SUPER_ADMIN (Siège) :**
- Classement RPS des hôtels
- Hôtels avec alertes critiques
- Conformité moyenne du parc
- Audits en retard

**Vue OPE_HEBERGEMENT :**
- Chambres du jour (à blanc / recouche)
- Contrôles à faire / faits
- Rituels en attente
- Tickets maintenance créés

**Vue OPE_TECHNIQUE :**
- Mes tickets ouverts (par priorité)
- Alertes fournisseurs en retard
- Suivi chambres à contrôler
- Notifications

---

### 3.2 — PERFORMANCE (onglet bottom nav)

Données TrustYou mensuelles par hôtel.

| Donnée              | Saisie      | V2 (API TrustYou)      |
|----------------------|-------------|------------------------|
| RPS                  | Manuelle    | Auto via Connect API   |
| RPS N-1              | Manuelle    | Auto                   |
| CompIndex            | Manuelle    | Auto                   |
| Nombre d'avis        | Manuelle    | Auto                   |
| Taux de réponse      | Manuelle    | Auto                   |
| Impacts négatifs 1-3 | Manuelle    | Auto (Opinion scores)  |
| Impacts positifs 1-3 | Manuelle    | Auto                   |
| Sparkles/Perso       | Manuelle    | Manuelle               |
| Animations réalisées | Manuelle    | Manuelle               |

**TrustYou Connect API** — endpoint : api.trustyou.com
- Authentification par API key (à demander à votre account manager TY)
- Récupération automatique : TrustScore, Meta-Review, 
  sentiment categories, response rate
- Cron job hebdomadaire pour mise à jour

**Vue SUPER_ADMIN :** tableau comparatif RPS tous hôtels + évolution

---

### 3.3 — ACTIONS (onglet bottom nav)

Plan d'action qualité — inchangé.
- Catégories : Chambre, Propreté, Équipement, Maintenance
- Cycle de statuts : À faire → En cours → Fait
- Filtres, responsable, date, budget
- Barre de progression

**Ajout V2 :** Lien avec les tickets maintenance.
Si un ticket technique génère une action qualité, on peut le rattacher.

---

### 3.4 — TECHNIQUE (onglet bottom nav)

Maintenance préventive & corrective — 5 sous-onglets :

```
🎯 Alertes        → Compteurs temps réel (urgences, retards)
🛏 Chambres       → État équipements chambre par chambre
🏢 Communs        → Parties communes (peinture, sols, mobiliers…)
⚡ Quotidien       → Tickets maintenance (zone, priorité, coût)
📋 Fournisseurs   → Suivi réglementaire (chaufferie, SSI, ascenseur…)
```

---

### 3.5 — CONTRÔLE CHAMBRE (onglet bottom nav) — À DÉVELOPPER

Fusion du module RoomControl dans la mega-app.

**Flux quotidien :**
```
Début de journée
  └→ OPE_HEBERGEMENT saisit la liste des chambres du jour
     (à blanc / recouche / DND)
       └→ OPE_HEBERGEMENT (FDC) fait le ménage → marque "Terminé"
            └→ OPE_HEBERGEMENT (Réception) audite avec grille
                 ├→ ✅ OK → Chambre prête
                 └→ ❌ KO → Notification → Rectification
                              └→ Revalidation → Chambre prête
```

**Grille de contrôle :**
- Mode RAPIDE (quotidien) : 15-20 points essentiels, toggle OK/KO
- Mode AVANCÉ (ponctuel) : 68 points détaillés, notation 0/1/2
  Zones : Entrée (25 pts) / Chambre (13 pts) / SDB (25 pts) / Installation (5 pts)

**Calcul de conformité :**
```
Score = (1 - (Total points / (2 × Nb contrôles × Nb chambres))) × 100
```

**Différence avec "Technique > Suivi chambres" :**
- Technique = état du matériel (BON/DÉGRADÉ/HS) → vision OPE_TECHNIQUE
- Contrôle chambre = propreté + présentation → vision OPE_HEBERGEMENT

**Dashboard contrôle :**
- Chambres auditées aujourd'hui / total
- Taux de conformité du jour/semaine/mois
- Top 5 non-conformités récurrentes
- Performance par agent OPE_HEBERGEMENT

---

### 3.6 — AUDIT GLOBAL HÔTEL (accessible depuis Hub) — À DÉVELOPPER

Audit trimestriel de l'établissement dans sa globalité,
avec un œil client. Réalisable par l'ADMIN (GM) ou le SUPER_ADMIN.

**Zones auditées :**
```
1. EXTÉRIEURS & ABORDS
   Signalétique, parking, façade, éclairage, propreté abords,
   espaces verts, terrasse

2. ACCUEIL & LOBBY
   Première impression, propreté, odeur, éclairage, mobilier,
   affichage, documentation, musique d'ambiance

3. RÉCEPTION
   Rapidité prise en charge, sourire, tenue vestimentaire,
   connaissance produit, upsell, procédure check-in

4. COULOIRS & CIRCULATIONS
   Propreté, éclairage, signalétique étages, état moquette/sol,
   peinture, portes coupe-feu, issues de secours

5. CHAMBRE TÉMOIN (1 chambre auditée en détail)
   Propreté, literie, SDB, équipements, consommables,
   documentation, fonctionnement TV/clim/chauffage

6. PETIT-DÉJEUNER / RESTAURANT
   Buffet (variété, fraîcheur, présentation), propreté salle,
   service, horaires affichés, vaisselle

7. ESPACES COMMUNS
   Salle séminaire, fitness, piscine (si applicable),
   ascenseur, escaliers, buanderie

8. SÉCURITÉ & CONFORMITÉ
   Extincteurs visibles, issues de secours dégagées,
   affichage sécurité, registre de sécurité à jour
```

**Notation :**
- Chaque point : 1 (Non conforme) / 2 (Acceptable) / 3 (Conforme) / 4 (Excellent)
- Commentaire + photo optionnelle par point
- Score global sur 100, par zone et total

**Fréquence :** Trimestriel (rappel automatique)

**Livrable :** Rapport d'audit avec :
- Score global + scores par zone
- Points forts / Points d'amélioration
- Actions correctives générées (liées au Plan d'Action)
- Comparaison avec l'audit précédent (évolution)

**Vue SUPER_ADMIN :** classement des hôtels par score d'audit,
carte des derniers audits réalisés, alertes audits en retard.

---

### 3.7 — RITUELS (accessible depuis Hub)

Inchangé. Checklist qualité avec descriptions dépliables.

---

### 3.8 — PLAYBOOK (accessible depuis Hub)

Inchangé. Animations, saisons, boosters + propositions équipe.

---

### 3.9 — COMMISSION DE SÉCURITÉ (accessible depuis Hub) — À DÉVELOPPER

Module dédié au suivi réglementaire sécurité, séparé de la 
maintenance fournisseurs car enjeux juridiques et obligations légales.

**Registre de sécurité :**
```
1. MOYENS DE SECOURS
   ├── Extincteurs (vérification annuelle + date)
   ├── RIA / colonnes sèches
   ├── Éclairage de sécurité (BAES)
   ├── Alarme incendie (SSI)
   ├── Désenfumage
   └── Plans d'évacuation affichés

2. CONTRÔLES RÉGLEMENTAIRES
   ├── Bureau de contrôle (électricité, gaz, ascenseur)
   ├── Commission de sécurité (passage + avis)
   ├── Vérification installations électriques
   ├── Vérification installations gaz
   ├── Contrôle ascenseur (annuel + quinquennal)
   └── Diagnostic amiante / plomb (si applicable)

3. FORMATIONS & EXERCICES
   ├── Formation incendie équipiers (annuelle)
   ├── Exercice d'évacuation (semestriel)
   ├── Formation premiers secours (SST)
   └── Registre de formation (dates + participants)

4. REGISTRE DES OBSERVATIONS
   ├── Prescriptions de la commission de sécurité
   ├── Réserves des bureaux de contrôle
   ├── Actions correctives engagées
   └── Levée des réserves (date + preuve)
```

**Fonctionnalités :**
- Chaque item a : date dernier contrôle, fréquence, alerte auto
- Upload du PV de commission / rapport de contrôle (Cloudinary)
- Suivi des prescriptions avec statut (à lever / levée / en cours)
- Rappel automatique avant échéance de visite
- Historique complet pour présentation en commission

**Alerte commission :**
- Calcul automatique de la prochaine visite
- Compteur "jours avant commission" sur le Hub ADMIN
- Liste des réserves non levées = bloquant

**Accès :** SUPER_ADMIN + ADMIN uniquement.
OPE_TECHNIQUE peut consulter ses items (extincteurs, SSI…) 
mais ne peut pas modifier le registre.

---

## 4. NAVIGATION

### Bottom Nav (5 onglets) — toujours visibles

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   Hub    │   Perf.  │ Actions  │  Tech.   │ Chambres │
│    🏠    │    📊    │    ✓     │    🔧    │    🛏    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Accessible depuis le Hub (cartes cliquables)

- 📋 Rituels
- 📖 Playbook
- 🏨 Audit Global (badge "trimestriel" + jours restants)
- 🔥 Commission de Sécurité (badge alertes réserves non levées)

### Navigation adaptée au rôle

| Module             | SUPER | ADMIN | OPE_HEBERG | OPE_TECH |
|--------------------|-------|-------|------------|----------|
| Hub                |  ✅   |  ✅   |     ✅     |   ✅*    |
| Performance        |  ✅   |  ✅   |     👁     |    —     |
| Actions            |  ✅   |  ✅   |     ✏️     |    —     |
| Technique          |  ✅   |  ✅   |     ⚡     |   ✅     |
| Contrôle chambre   |  ✅   |  ✅   |     ✅     |    —     |
| Rituels            |  ✅   |  ✅   |     ✅     |    —     |
| Playbook           |  ✅   |  ✅   |     👁     |    —     |
| Audit Global       |  ✅   |  ✅   |     —      |    —     |
| Commission Sécu.   |  ✅   |  ✅   |     —      |   👁     |

✅ = accès complet  👁 = lecture seule  ✏️ = édition limitée
⚡ = uniquement tickets quotidien (créer)  ✅* = vue simplifiée (ses tickets)
— = non visible

---

## 5. STACK TECHNIQUE

```
Frontend      Next.js 14 (App Router) + TypeScript + Tailwind
Auth          NextAuth.js (credentials + Google OAuth)
BDD           PostgreSQL (Neon) + Prisma ORM
State         Zustand
Forms         React Hook Form + Zod
Mailing       Resend (React Email templates)
Push          Web Push API + Service Workers
Storage       Cloudinary (photos audits, logos)
PWA           next-pwa (manifest, offline, install)
API externe   TrustYou Connect API (cron hebdo)
Déploiement   Vercel
Repo          GitHub (monorepo)
```

---

## 6. MODÈLE DE DONNÉES (simplifié)

```
Organization (somnOO)
  └── Hotel
        ├── name, city, rooms, lastReno, rpsTarget
        ├── Users[] (role: SUPER|ADMIN|OPE_HEBERGEMENT|OPE_TECHNIQUE, hotelId)
        │
        ├── MonthlyPerf[] (month, year, rps, compIndex, reviews…)
        │
        ├── ActionPlan[] (cat, text, owner, status, date, budget)
        │
        ├── RitualCheck[] (ritualId, userId, date, done)
        │
        ├── RoomInspection[] ← Contrôle chambre quotidien
        │     ├── room, date, inspector, mode (rapide/avancé)
        │     ├── RoomInspectionItem[] (checkId, score 0/1/2)
        │     └── conformityScore (calculé)
        │
        ├── HotelAudit[] ← Audit global trimestriel
        │     ├── date, auditor, globalScore
        │     ├── AuditZone[] (zone, score, comment, photos[])
        │     └── AuditAction[] → lié à ActionPlan
        │
        ├── RoomEquipCheck[] ← Suivi technique chambres
        │     ├── room, date, equipStates{}, action, status
        │
        ├── CommonAreaCheck[] ← Suivi parties communes
        │
        ├── MaintenanceTicket[] ← Maintenance quotidienne
        │     ├── date, zone, equip, problem, priority, status, cost
        │     └── assignedTo (technicien)
        │
        ├── SupplierMaint[] ← Maintenance fournisseurs
        │     ├── equip, lastDate, frequency, supplier, reserves
        │
        ├── PlaybookEvent[] ← Animations custom
        ├── PlaybookSeason[] ← Actions saisonnières custom
        ├── PlaybookBoost[] ← Boosters avis custom
        │
        ├── SafetyItem[] ← Commission de sécurité
        │     ├── category (moyens_secours|controles|formations|observations)
        │     ├── label, lastDate, frequency, nextDate (calculé)
        │     ├── status (conforme|réserve|en_cours|expiré)
        │     ├── documents[] (PV, rapports → Cloudinary URLs)
        │     └── reserves[] (texte, date, levée O/N, preuve)
        │
        └── SafetyCommission[] ← Visites de la commission
              ├── date, avis (favorable|défavorable|favorable_avec_réserves)
              ├── prescriptions[]
              └── nextVisitDate
```

---

## 7. PHASES DE DÉVELOPPEMENT

### Phase 1 — MVP (ce qu'on a aujourd'hui)
- [x] Hub / Dashboard
- [x] Performance (saisie manuelle)
- [x] Plan d'action
- [x] Rituels avec descriptions
- [x] Playbook avec propositions
- [x] Suivi technique complet

### Phase 2 — Contrôle Chambre + Audit + Sécurité
- [ ] Module Contrôle Chambre (mode rapide + avancé)
- [ ] Flux OPE_HEBERGEMENT : ménage → audit → revalidation
- [ ] Module Audit Global Hôtel (8 zones, scoring)
- [ ] Module Commission de Sécurité (registre, réserves, PV)
- [ ] Hub redesign avec cartes d'accès
- [ ] Notifications push

### Phase 3 — Backend & Auth
- [ ] Prisma + PostgreSQL (Neon)
- [ ] NextAuth.js (4 rôles : SUPER_ADMIN, ADMIN, OPE_HEBERGEMENT, OPE_TECHNIQUE)
- [ ] API routes pour chaque module
- [ ] Persistance des données
- [ ] PWA complète (offline, sync)

### Phase 4 — Multi-hôtel & Intégrations
- [ ] Vue consolidée SUPER_ADMIN
- [ ] Comparatifs inter-hôtels
- [ ] TrustYou Connect API (auto-sync)
- [ ] Rapports PDF (export audits)
- [ ] Mailing (alertes, rappels, rapports)

### Phase 5 — Scale
- [ ] Onboarding wizard nouveau hôtel
- [ ] Templates de grilles configurables
- [ ] Historique & analytics avancés
- [ ] Mode offline complet (IndexedDB)
- [ ] App mobile native (React Native / Expo)

---

## 8. DÉCISIONS VALIDÉES

| #  | Question                        | Décision                              |
|----|----------------------------------|---------------------------------------|
| 1  | Nom du produit                   | **somnOO Quality**                    |
| 2  | API TrustYou                     | Oui — clé API à récupérer             |
| 3  | Stockage photos                  | **Cloudinary** (voir ci-dessous)      |
| 4  | Mode offline                     | Non requis                            |
| 5  | Export BI (Power BI, Looker…)    | Pas pour la v1, prévoir dans le futur |
| 6  | Commission de sécurité           | **Module dédié** (voir §3.9)          |

### Pourquoi Cloudinary pour les photos

- Plan gratuit généreux (25 000 transformations/mois, 25 Go stockage)
- Upload direct depuis le front (widget React, pas besoin de passer par le back)
- Redimensionnement et compression automatiques (photos d'audit souvent 
  prises au téléphone = lourdes, Cloudinary optimise à la volée)
- CDN mondial = chargement rapide quel que soit l'hôtel
- SDK Next.js officiel (next-cloudinary)
- Pas de maintenance serveur contrairement à un S3 maison
- Migration vers S3 facile si nécessaire plus tard (URLs stables)
