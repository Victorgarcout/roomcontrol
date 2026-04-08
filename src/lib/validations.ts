import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Minimum 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Minimum 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const hotelSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  logo: z.string().optional(),
});

export const roomCategorySchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Prix invalide"),
  capacity: z.coerce.number().min(1, "Capacité minimum 1"),
  amenities: z.string().optional(),
  photo: z.string().optional(),
});

export const roomSchema = z.object({
  number: z.string().min(1, "Numéro requis"),
  floor: z.coerce.number().min(0),
  categoryId: z.string().min(1, "Catégorie requise"),
  notes: z.string().optional(),
});

export const quickBookingSchema = z.object({
  guestFirstName: z.string().min(1, "Prénom requis"),
  guestLastName: z.string().min(1, "Nom requis"),
  roomId: z.string().min(1, "Chambre requise"),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.coerce.number().min(1).default(1),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]).default("CASH"),
  notes: z.string().optional(),
});

export const advancedBookingSchema = quickBookingSchema.extend({
  guestEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  guestPhone: z.string().optional(),
  guestNationality: z.string().optional(),
  guestIdNumber: z.string().optional(),
  breakfast: z.boolean().default(false),
  parking: z.boolean().default(false),
  babyBed: z.boolean().default(false),
  transfer: z.boolean().default(false),
  discount: z.coerce.number().min(0).max(100).default(0),
  isProInvoice: z.boolean().default(false),
  company: z.string().optional(),
  companyVat: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const auditTemplateSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  scoringMode: z.enum(["BINARY", "SCORE", "COMMENT_ONLY"]).default("BINARY"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type HotelInput = z.infer<typeof hotelSchema>;
export type RoomCategoryInput = z.infer<typeof roomCategorySchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type QuickBookingInput = z.infer<typeof quickBookingSchema>;
export type AdvancedBookingInput = z.infer<typeof advancedBookingSchema>;
