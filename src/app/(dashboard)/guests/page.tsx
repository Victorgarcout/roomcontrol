"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";

export default function GuestsPage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/guests")
      .then((r) => r.json())
      .then(setGuests)
      .finally(() => setLoading(false));
  }, []);

  const filtered = guests.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      (g.email && g.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
        <p className="text-slate-500">{guests.length} client(s) enregistre(s)</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Telephone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nationalite</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sejours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map((guest) => (
                <tr key={guest.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {guest.firstName} {guest.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{guest.email || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{guest.phone || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{guest.nationality || "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{guest._count?.bookings || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
