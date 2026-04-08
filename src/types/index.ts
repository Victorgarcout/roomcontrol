import { Role, RoomStatus, BookingStatus, PaymentMethod, AuditScoringMode } from "@/generated/prisma";

export type { Role, RoomStatus, BookingStatus, PaymentMethod, AuditScoringMode };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string;
  activeHotelId?: string;
}

export interface HotelWithDetails {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  _count: {
    rooms: number;
    bookings: number;
  };
}

export interface RoomWithCategory {
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  notes: string | null;
  category: {
    id: string;
    name: string;
    price: number;
    capacity: number;
  };
  currentBooking?: {
    id: string;
    guest: { firstName: string; lastName: string };
    checkIn: Date;
    checkOut: Date;
  } | null;
}

export interface DashboardStats {
  totalRooms: number;
  available: number;
  occupied: number;
  maintenance: number;
  cleaning: number;
  blocked: number;
  occupancyRate: number;
  todayArrivals: number;
  todayDepartures: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

export interface BookingFormData {
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestNationality?: string;
  guestIdNumber?: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  // Advanced mode fields
  breakfast?: boolean;
  parking?: boolean;
  babyBed?: boolean;
  transfer?: boolean;
  discount?: number;
  isProInvoice?: boolean;
  company?: string;
  companyVat?: string;
  specialRequests?: string;
}

export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: "Disponible", color: "text-emerald-700", bg: "bg-emerald-100" },
  OCCUPIED: { label: "Occup\u00e9e", color: "text-red-700", bg: "bg-red-100" },
  MAINTENANCE: { label: "Maintenance", color: "text-orange-700", bg: "bg-orange-100" },
  CLEANING: { label: "M\u00e9nage", color: "text-blue-700", bg: "bg-blue-100" },
  BLOCKED: { label: "Bloqu\u00e9e", color: "text-gray-700", bg: "bg-gray-200" },
};

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "text-yellow-700" },
  CONFIRMED: { label: "Confirm\u00e9e", color: "text-blue-700" },
  CHECKED_IN: { label: "Check-in", color: "text-green-700" },
  CHECKED_OUT: { label: "Check-out", color: "text-gray-700" },
  CANCELLED: { label: "Annul\u00e9e", color: "text-red-700" },
  NO_SHOW: { label: "No-show", color: "text-purple-700" },
};

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  CASH: "Esp\u00e8ces",
  CARD: "Carte bancaire",
  TRANSFER: "Virement",
  OTHER: "Autre",
};
