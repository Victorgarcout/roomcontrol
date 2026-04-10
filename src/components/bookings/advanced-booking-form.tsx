"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { advancedBookingSchema, type AdvancedBookingInput } from "@/lib/validations";
import { useHotelStore } from "@/stores/hotel-store";
import { PAYMENT_METHODS } from "@/types";
import { calculateNights, formatCurrency } from "@/lib/utils";
import { Loader2, Check, User, Calendar, Package, Receipt } from "lucide-react";

interface AdvancedBookingFormProps {
  roomId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TABS = [
  { id: "guest", label: "Client", icon: User },
  { id: "stay", label: "Sejour", icon: Calendar },
  { id: "extras", label: "Options", icon: Package },
  { id: "billing", label: "Facturation", icon: Receipt },
];

export function AdvancedBookingForm({ roomId, onSuccess, onCancel }: AdvancedBookingFormProps) {
  const { activeHotelId } = useHotelStore();
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("guest");
  const [rooms, setRooms] = useState<any[]>([]);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AdvancedBookingInput>({
    resolver: zodResolver(advancedBookingSchema) as any,
    defaultValues: {
      roomId: roomId || "",
      checkIn: new Date().toISOString().split("T")[0] as any,
      checkOut: new Date(Date.now() + 86400000).toISOString().split("T")[0] as any,
      guests: 1,
      paymentMethod: "CASH",
      breakfast: false,
      parking: false,
      babyBed: false,
      transfer: false,
      discount: 0,
      isProInvoice: false,
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");
  const discount = watch("discount") || 0;

  // Fetch rooms for selection
  useEffect(() => {
    if (!activeHotelId) return;
    fetch(`/api/rooms?hotelId=${activeHotelId}&status=AVAILABLE`)
      .then((r) => r.json())
      .then(setRooms);
  }, [activeHotelId]);

  const selectedRoom = rooms.find((r: any) => r.id === watch("roomId"));
  const nights = checkIn && checkOut ? calculateNights(new Date(checkIn), new Date(checkOut)) : 0;
  const subtotal = (selectedRoom?.category?.price || 0) * nights;
  const total = subtotal - (subtotal * discount / 100);

  const onSubmit = async (data: AdvancedBookingInput) => {
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, hotelId: activeHotelId, quickMode: false }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Erreur");
        return;
      }
      onSuccess();
    } catch {
      setError("Erreur de connexion");
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reservation avancee</h3>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Mode avance</span>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tab: Guest */}
        <div className={activeTab === "guest" ? "space-y-3" : "hidden"}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Prenom *</label>
              <input {...register("guestFirstName")} className={inputClass} placeholder="Jean" />
              {errors.guestFirstName && <p className="text-red-500 text-xs mt-1">{errors.guestFirstName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Nom *</label>
              <input {...register("guestLastName")} className={inputClass} placeholder="Dupont" />
              {errors.guestLastName && <p className="text-red-500 text-xs mt-1">{errors.guestLastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" {...register("guestEmail")} className={inputClass} placeholder="jean@email.com" />
            </div>
            <div>
              <label className={labelClass}>Telephone</label>
              <input {...register("guestPhone")} className={inputClass} placeholder="+33 6 12 34 56 78" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nationalite</label>
              <input {...register("guestNationality")} className={inputClass} placeholder="Francaise" />
            </div>
            <div>
              <label className={labelClass}>N° piece d&apos;identite</label>
              <input {...register("guestIdNumber")} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Tab: Stay */}
        <div className={activeTab === "stay" ? "space-y-3" : "hidden"}>
          <div>
            <label className={labelClass}>Chambre *</label>
            <select {...register("roomId")} className={inputClass}>
              <option value="">Selectionnez une chambre</option>
              {rooms.map((r: any) => (
                <option key={r.id} value={r.id}>
                  #{r.number} - {r.category.name} ({formatCurrency(r.category.price)}/nuit)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Arrivee *</label>
              <input type="date" {...register("checkIn")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Depart *</label>
              <input type="date" {...register("checkOut")} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Personnes</label>
              <input type="number" min={1} {...register("guests")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Paiement</label>
              <select {...register("paymentMethod")} className={inputClass}>
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price summary */}
          {nights > 0 && selectedRoom && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{nights} nuit{nights > 1 ? "s" : ""} x {formatCurrency(selectedRoom.category.price)}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Remise ({discount}%)</span>
                  <span>-{formatCurrency(subtotal * discount / 100)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-700 dark:text-blue-300 pt-1 border-t border-blue-200">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab: Extras */}
        <div className={activeTab === "extras" ? "space-y-3" : "hidden"}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "breakfast" as const, label: "Petit-dejeuner" },
              { name: "parking" as const, label: "Parking" },
              { name: "babyBed" as const, label: "Lit bebe" },
              { name: "transfer" as const, label: "Transfert" },
            ].map((extra) => (
              <label key={extra.name} className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                <input type="checkbox" {...register(extra.name)} className="rounded" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{extra.label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className={labelClass}>Demandes speciales</label>
            <textarea {...register("specialRequests")} rows={3} className={`${inputClass} resize-none`} placeholder="Chambre calme, etage eleve..." />
          </div>
        </div>

        {/* Tab: Billing */}
        <div className={activeTab === "billing" ? "space-y-3" : "hidden"}>
          <div>
            <label className={labelClass}>Remise (%)</label>
            <input type="number" min={0} max={100} {...register("discount")} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isProInvoice")} className="rounded" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Facture professionnelle</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Entreprise</label>
              <input {...register("company")} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>N° TVA</label>
              <input {...register("companyVat")} className={inputClass} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes internes</label>
          <textarea {...register("notes")} rows={2} className={`${inputClass} resize-none`} placeholder="Notes internes..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Confirmer la reservation
          </button>
        </div>
      </form>
    </div>
  );
}
