"use client";

import { useEffect, useState, useCallback } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { BOOKING_STATUS_CONFIG } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CalendarCheck, Plus, Search, Loader2, Eye } from "lucide-react";
import Link from "next/link";

export default function BookingsPage() {
  const { activeHotelId } = useHotelStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    if (!activeHotelId) return;
    setLoading(true);
    const params = new URLSearchParams({ hotelId: activeHotelId });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/bookings?${params}`);
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  }, [activeHotelId, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.guest.firstName.toLowerCase().includes(q) ||
      b.guest.lastName.toLowerCase().includes(q) ||
      b.room.number.includes(q)
    );
  });

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <CalendarCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Selectionnez un hotel</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reservations</h1>
          <p className="text-slate-500">{bookings.length} reservation(s)</p>
        </div>
        <Link
          href="/bookings/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" /> Nouvelle reservation
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou n° chambre..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(BOOKING_STATUS_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chambre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check-in</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check-out</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nuits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((booking) => {
                const statusConfig = BOOKING_STATUS_CONFIG[booking.status as keyof typeof BOOKING_STATUS_CONFIG];
                return (
                  <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </p>
                      {booking.guest.email && <p className="text-xs text-slate-400">{booking.guest.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      #{booking.room.number}
                      <span className="text-xs text-slate-400 ml-1">({booking.room.category.name})</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(booking.checkIn)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(booking.checkOut)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{booking.nights}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{formatCurrency(booking.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color || ""}`}>
                        {statusConfig?.label || booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${booking.id}`} className="text-blue-600 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Aucune reservation trouvee
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
