import { z } from "zod";

// ── Performance ──────────────────────────────────
export const upsertPerformanceSchema = z.object({
  hotelId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  rps: z.number().optional(),
  rpsN1: z.number().optional(),
  compIndex: z.number().optional(),
  nbReviews: z.number().int().optional(),
  responseRate: z.number().min(0).max(100).optional(),
  negImpact1: z.string().optional(),
  negImpact2: z.string().optional(),
  negImpact3: z.string().optional(),
  posImpact1: z.string().optional(),
  posImpact2: z.string().optional(),
  posImpact3: z.string().optional(),
  sparkles: z.number().int().optional(),
  animations: z.number().int().optional(),
  comments: z.string().optional(),
});

// ── Actions ──────────────────────────────────────
export const createActionSchema = z.object({
  hotelId: z.string().min(1),
  category: z.enum(["CHAMBRE", "PROPRETE", "EQUIPEMENT", "MAINTENANCE"]),
  text: z.string().min(1).max(500),
  dueDate: z.string().datetime().optional(),
  owner: z.string().min(1).max(50),
  score: z.number().optional(),
  budget: z.number().optional(),
  comment: z.string().optional(),
});

export const updateActionSchema = z.object({
  category: z.enum(["CHAMBRE", "PROPRETE", "EQUIPEMENT", "MAINTENANCE"]).optional(),
  text: z.string().min(1).max(500).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  owner: z.string().min(1).max(50).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  score: z.number().optional(),
  budget: z.number().optional(),
  comment: z.string().optional(),
});

// ── Rituels ──────────────────────────────────────
export const toggleRitualSchema = z.object({
  hotelId: z.string().min(1),
  ritualId: z.string().min(1),
  weekStart: z.string().datetime(),
  done: z.boolean(),
});

// ── Maintenance Tickets ──────────────────────────
export const createTicketSchema = z.object({
  hotelId: z.string().min(1),
  zone: z.string().min(1),
  equipment: z.string().min(1),
  problem: z.string().min(1),
  priority: z.enum(["HAUTE", "MOYENNE", "FAIBLE"]),
  cost: z.number().optional(),
  assignedTo: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  comments: z.string().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(["A_FAIRE", "EN_COURS", "TERMINE"]).optional(),
  priority: z.enum(["HAUTE", "MOYENNE", "FAIBLE"]).optional(),
  assignedTo: z.string().optional(),
  cost: z.number().optional(),
  comments: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
});

// ── Room Equipment ───────────────────────────────
export const createRoomEquipSchema = z.object({
  hotelId: z.string().min(1),
  roomNumber: z.string().min(1),
  checkDate: z.string().datetime(),
  equipStates: z.record(z.string(), z.enum(["BON", "DEGRADE", "HS"])),
  action: z.string().optional(),
  checkedBy: z.string().optional(),
});

export const updateRoomEquipSchema = z.object({
  equipStates: z.record(z.string(), z.enum(["BON", "DEGRADE", "HS"])).optional(),
  action: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

// ── Common Areas ─────────────────────────────────
export const createCommonAreaSchema = z.object({
  hotelId: z.string().min(1),
  areaName: z.string().min(1),
  checkDate: z.string().datetime(),
  checkStates: z.record(z.string(), z.enum(["BON", "DEGRADE", "HS"])),
  action: z.string().optional(),
});

export const updateCommonAreaSchema = z.object({
  checkStates: z.record(z.string(), z.enum(["BON", "DEGRADE", "HS"])).optional(),
  action: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
});

// ── Suppliers ────────────────────────────────────
export const createSupplierSchema = z.object({
  hotelId: z.string().min(1),
  equipment: z.string().min(1),
  lastCheck: z.string().datetime().optional(),
  frequency: z.string().min(1),
  supplier: z.string().optional(),
  reserves: z.string().optional(),
  quotation: z.number().optional(),
  documents: z.array(z.string().url()).optional(),
});

export const updateSupplierSchema = z.object({
  lastCheck: z.string().datetime().optional(),
  frequency: z.string().optional(),
  supplier: z.string().optional(),
  reserves: z.string().optional(),
  quotation: z.number().optional(),
  documents: z.array(z.string().url()).optional(),
});

// ── Safety ───────────────────────────────────────
export const createSafetyItemSchema = z.object({
  hotelId: z.string().min(1),
  category: z.string().min(1),
  label: z.string().min(1),
  lastCheck: z.string().datetime().optional(),
  frequency: z.string().min(1),
  status: z.enum(["CONFORME", "RESERVE", "EN_COURS", "EXPIRE"]).optional(),
  documents: z.array(z.string().url()).optional(),
});

export const updateSafetyItemSchema = z.object({
  lastCheck: z.string().datetime().optional(),
  status: z.enum(["CONFORME", "RESERVE", "EN_COURS", "EXPIRE"]).optional(),
  documents: z.array(z.string().url()).optional(),
});

export const createCommissionSchema = z.object({
  hotelId: z.string().min(1),
  visitDate: z.string().datetime(),
  result: z.enum(["favorable", "defavorable", "favorable_avec_reserves"]),
  prescriptions: z.array(z.object({
    text: z.string(),
    resolved: z.boolean().default(false),
    resolvedDate: z.string().datetime().optional(),
  })),
  nextVisitDate: z.string().datetime().optional(),
  pvDocument: z.string().url().optional(),
});

export const updateCommissionSchema = z.object({
  result: z.enum(["favorable", "defavorable", "favorable_avec_reserves"]).optional(),
  prescriptions: z.array(z.object({
    text: z.string(),
    resolved: z.boolean(),
    resolvedDate: z.string().datetime().optional(),
  })).optional(),
  nextVisitDate: z.string().datetime().optional(),
  pvDocument: z.string().url().optional(),
});

// ── Hotel Audit ──────────────────────────────────
export const createHotelAuditSchema = z.object({
  hotelId: z.string().min(1),
  auditDate: z.string().datetime(),
  items: z.array(z.object({
    zone: z.string().min(1),
    item: z.string().min(1),
    score: z.number().int().min(1).max(4),
    comment: z.string().optional(),
    photos: z.array(z.string().url()).optional(),
  })).min(1),
});

// ── Playbook ─────────────────────────────────────
export const createPlaybookSchema = z.object({
  hotelId: z.string().min(1),
  type: z.enum(["event", "season_summer", "season_winter", "season_all", "boost"]),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  effort: z.enum(["low", "med", "high"]).optional(),
});
