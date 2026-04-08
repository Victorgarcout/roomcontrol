"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quickBookingSchema, type QuickBookingInput } from "@/lib/validations";
import { useHotelStore } from "@/stores/hotel-store";
import { PAYMENT_METHODS } from "@/types";
import { Loader2, Check } from "lucide-react";

interface QuickBookingFormProps {
  roomId: string;
  roomNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function QuickBookingForm({ roomId, roomNumber, onSuccess, onCancel }: QuickBookingFormProps) {
  const { activeHotelId } = useHotelStore();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<QuickBookingInput>({
    resolver: zodResolver(quickBookingSchema),
    defaultValues: {
      roomId,
      checkIn: new Date().toISOString().split("T")[0] as any,
      checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0] as any,
      guests: 1,
      paymentMethod: "CASH",
    },
  });

  const onSubmit = async (data: QuickBookingInput) => {
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, hotelId: activeHotelId, quickMode: true }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Erreur lors de la reservation");
        return;
      }

      onSuccess();
    } catch {
      setError("Erreur de connexion");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Check-in rapide - Chambre #{roomNumber}
        </h3>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Mode rapide</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="hidden" {...register("roomId")} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prenom *</label>
            <input {...register("guestFirstName")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jean" />
            {errors.guestFirstName && <p className="text-red-500 text-xs mt-1">{errors.guestFirstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
            <input {...register("guestLastName")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Dupont" />
            {errors.guestLastName && <p className="text-red-500 text-xs mt-1">{errors.guestLastName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arrivee *</label>
            <input type="date" {...register("checkIn")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Depart *</label>
            <input type="date" {...register("checkOut")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Personnes</label>
            <input type="number" min={1} {...register("guests")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paiement</label>
            <select {...register("paymentMethod")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
          <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Notes rapides..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition text-sm">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Valider le check-in
          </button>
        </div>
      </form>
    </div>
  );
}
