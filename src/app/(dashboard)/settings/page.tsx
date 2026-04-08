"use client";

import { useEffect, useState } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Settings, Save, Loader2, Hotel, Users, Shield } from "lucide-react";

export default function SettingsPage() {
  const { activeHotelId } = useHotelStore();
  const { user } = useCurrentUser();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeHotelId) { setLoading(false); return; }
    fetch(`/api/hotels/${activeHotelId}`)
      .then((r) => r.json())
      .then(setHotel)
      .finally(() => setLoading(false));
  }, [activeHotelId]);

  const handleSave = async () => {
    if (!hotel || !activeHotelId) return;
    setSaving(true);
    await fetch(`/api/hotels/${activeHotelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: hotel.name,
        address: hotel.address,
        phone: hotel.phone,
        email: hotel.email,
      }),
    });
    setSaving(false);
  };

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Settings className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Selectionnez un hotel</h2>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parametres</h1>
        <p className="text-slate-500">Configuration de votre hotel</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : hotel ? (
        <>
          {/* Hotel Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Hotel className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Informations hotel</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
              <input value={hotel.name || ""} onChange={(e) => setHotel({ ...hotel, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adresse</label>
              <input value={hotel.address || ""} onChange={(e) => setHotel({ ...hotel, address: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telephone</label>
                <input value={hotel.phone || ""} onChange={(e) => setHotel({ ...hotel, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input value={hotel.email || ""} onChange={(e) => setHotel({ ...hotel, email: e.target.value })} className={inputClass} />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>

          {/* User Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mon compte</h2>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Nom :</span> <span className="text-slate-900 dark:text-white font-medium">{user?.name}</span></p>
              <p><span className="text-slate-500">Email :</span> <span className="text-slate-900 dark:text-white font-medium">{user?.email}</span></p>
              <p><span className="text-slate-500">Role :</span> <span className="text-slate-900 dark:text-white font-medium">{user?.role}</span></p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
