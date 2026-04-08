"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hotelSchema, type HotelInput, type RoomCategoryInput } from "@/lib/validations";
import { useHotelStore } from "@/stores/hotel-store";
import {
  ArrowRight, ArrowLeft, Plus, Trash2, Loader2,
  Check, Building, BedDouble, ListChecks
} from "lucide-react";

const STEPS = [
  { title: "Informations generales", icon: Building },
  { title: "Categories de chambres", icon: BedDouble },
  { title: "Chambres", icon: ListChecks },
];

interface CategoryWithRooms extends RoomCategoryInput {
  id?: string;
  roomCount: number;
  startNumber: string;
  autoNumber: boolean;
}

export default function NewHotelPage() {
  const router = useRouter();
  const { setActiveHotel } = useHotelStore();
  const [step, setStep] = useState(0);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryWithRooms[]>([]);
  const [saving, setSaving] = useState(false);

  // Step 1: Hotel info
  const hotelForm = useForm<HotelInput>({
    resolver: zodResolver(hotelSchema),
    defaultValues: { name: "", address: "", phone: "", email: "" },
  });

  const saveHotel = async (data: HotelInput) => {
    setSaving(true);
    try {
      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const hotel = await res.json();
      setHotelId(hotel.id);
      setStep(1);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Categories
  const addCategory = () => {
    setCategories([
      ...categories,
      { name: "", price: 0, capacity: 2, description: "", amenities: "", roomCount: 1, startNumber: "101", autoNumber: true },
    ]);
  };

  const updateCategory = (index: number, field: string, value: any) => {
    const updated = [...categories];
    (updated[index] as any)[field] = value;
    setCategories(updated);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const saveCategories = async () => {
    if (!hotelId || categories.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const saved = await res.json();
      setCategories(categories.map((c, i) => ({ ...c, id: saved[i]?.id })));
      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Step 3: Create rooms
  const createRooms = async () => {
    if (!hotelId) return;
    setSaving(true);
    try {
      const rooms: any[] = [];
      categories.forEach((cat) => {
        if (!cat.id) return;
        for (let i = 0; i < cat.roomCount; i++) {
          const num = cat.autoNumber
            ? String(parseInt(cat.startNumber) + i)
            : `${cat.startNumber}-${i + 1}`;
          const floor = Math.floor(parseInt(num) / 100) || 1;
          rooms.push({ categoryId: cat.id, number: num, floor });
        }
      });

      await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId, rooms }),
      });

      setActiveHotel(hotelId);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              i === step ? "bg-blue-600 text-white" : i < step ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              <span className="text-sm font-medium sm:hidden">{i + 1}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-slate-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {/* Step 1: Hotel Info */}
        {step === 0 && (
          <form onSubmit={hotelForm.handleSubmit(saveHotel)} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Informations de l&apos;hotel</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de l&apos;hotel *</label>
              <input {...hotelForm.register("name")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Grand Hotel" />
              {hotelForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{hotelForm.formState.errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
              <input {...hotelForm.register("address")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="123 Rue de la Paix, Paris" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telephone</label>
                <input {...hotelForm.register("phone")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+33 1 23 45 67 89" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input {...hotelForm.register("email")} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="contact@hotel.com" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Suivant
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Categories */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Categories de chambres</h2>
              <button onClick={addCategory} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Ajoutez au moins une categorie (ex: Simple, Double, Suite...)</p>
              </div>
            )}

            {categories.map((cat, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900 dark:text-white">Categorie {i + 1}</h3>
                  <button onClick={() => removeCategory(i)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nom *</label>
                    <input value={cat.name} onChange={(e) => updateCategory(i, "name", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" placeholder="Simple" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Prix/nuit (EUR) *</label>
                    <input type="number" value={cat.price} onChange={(e) => updateCategory(i, "price", parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Capacite</label>
                    <input type="number" value={cat.capacity} onChange={(e) => updateCategory(i, "capacity", parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nb chambres</label>
                    <input type="number" value={cat.roomCount} onChange={(e) => updateCategory(i, "roomCount", parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <input value={cat.description || ""} onChange={(e) => updateCategory(i, "description", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" placeholder="Chambre confortable avec vue..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Numero de depart</label>
                    <input value={cat.startNumber} onChange={(e) => updateCategory(i, "startNumber", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={cat.autoNumber} onChange={(e) => updateCategory(i, "autoNumber", e.target.checked)} className="rounded" />
                      Numerotation auto
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(0)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button onClick={saveCategories} disabled={saving || categories.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recapitulatif & Creation des chambres</h2>

            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{cat.name}</p>
                    <p className="text-sm text-slate-500">{cat.capacity} pers. - {cat.price} EUR/nuit</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{cat.roomCount} chambres</p>
                    <p className="text-xs text-slate-400">A partir du #{cat.startNumber}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Total : {categories.reduce((sum, c) => sum + c.roomCount, 0)} chambres seront creees
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 transition">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button onClick={createRooms} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Creer l&apos;hotel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
