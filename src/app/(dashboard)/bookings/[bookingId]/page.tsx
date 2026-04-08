"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BOOKING_STATUS_CONFIG, PAYMENT_METHODS } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft, Loader2, LogIn, LogOut, XCircle, User, Calendar, CreditCard, FileText
} from "lucide-react";
import Link from "next/link";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${params.bookingId}`)
      .then((r) => r.json())
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [params.bookingId]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    await fetch(`/api/bookings/${params.bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    // Refresh
    const res = await fetch(`/api/bookings/${params.bookingId}`);
    setBooking(await res.json());
    setActionLoading("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 text-center text-slate-500">Reservation introuvable</div>
    );
  }

  const statusConfig = BOOKING_STATUS_CONFIG[booking.status as keyof typeof BOOKING_STATUS_CONFIG];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Reservation #{booking.id.slice(-6)}
          </h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color}`}>
            {statusConfig?.label || booking.status}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {booking.status === "CONFIRMED" && (
          <button
            onClick={() => handleAction("checkin")}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {actionLoading === "checkin" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Check-in
          </button>
        )}
        {booking.status === "CHECKED_IN" && (
          <button
            onClick={() => handleAction("checkout")}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {actionLoading === "checkout" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Check-out
          </button>
        )}
        {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
          <button
            onClick={() => handleAction("cancel")}
            disabled={!!actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition disabled:opacity-50"
          >
            {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Annuler
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Client</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-slate-900 dark:text-white text-lg">{booking.guest.firstName} {booking.guest.lastName}</p>
            {booking.guest.email && <p className="text-slate-500">{booking.guest.email}</p>}
            {booking.guest.phone && <p className="text-slate-500">{booking.guest.phone}</p>}
            {booking.guest.nationality && <p className="text-slate-500">Nationalite: {booking.guest.nationality}</p>}
          </div>
        </div>

        {/* Stay info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Sejour</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>Chambre <span className="font-medium">#{booking.room.number}</span> ({booking.room.category.name})</p>
            <p>Arrivee: <span className="font-medium">{formatDate(booking.checkIn)}</span></p>
            <p>Depart: <span className="font-medium">{formatDate(booking.checkOut)}</span></p>
            <p>{booking.nights} nuit(s) - {booking.guests} personne(s)</p>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Facturation</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{booking.nights} nuit(s) x {formatCurrency(booking.ratePerNight)}</span>
              <span>{formatCurrency(booking.ratePerNight * booking.nights)}</span>
            </div>
            {booking.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Remise ({booking.discount}%)</span>
                <span>-{formatCurrency(booking.ratePerNight * booking.nights * booking.discount / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(booking.totalAmount)}</span>
            </div>
            <p className="text-slate-500">Paiement: {PAYMENT_METHODS[booking.paymentMethod as keyof typeof PAYMENT_METHODS]}</p>
          </div>
        </div>

        {/* Extras & Notes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            {booking.breakfast && <p>Petit-dejeuner inclus</p>}
            {booking.parking && <p>Parking reserve</p>}
            {booking.babyBed && <p>Lit bebe demande</p>}
            {booking.transfer && <p>Transfert organise</p>}
            {booking.notes && <p className="text-slate-500 mt-2">Notes: {booking.notes}</p>}
            {booking.specialRequests && <p className="text-slate-500">Demandes: {booking.specialRequests}</p>}
            <p className="text-xs text-slate-400 mt-3">Creee par {booking.createdBy.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
