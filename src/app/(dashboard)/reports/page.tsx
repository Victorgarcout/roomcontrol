"use client";

import { useEffect, useState } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Download, Loader2, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportsPage() {
  const { activeHotelId } = useHotelStore();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<"occupation" | "revenue">("occupation");
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!activeHotelId) return;
    setLoading(true);
    fetch(`/api/reports?hotelId=${activeHotelId}&type=${reportType}&period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeHotelId, reportType, period]);

  const exportCSV = () => {
    if (!data?.rows) return;
    const headers = Object.keys(data.rows[0] || {}).join(",");
    const rows = data.rows.map((r: any) => Object.values(r).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${reportType}_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BarChart3 className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Selectionnez un hotel</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rapports</h1>
          <p className="text-slate-500">Analyses et statistiques</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data?.rows?.length}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="flex gap-3">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="occupation">Taux d&apos;occupation</option>
          <option value="revenue">Revenus par categorie</option>
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="quarter">Ce trimestre</option>
          <option value="year">Cette annee</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {reportType === "occupation" ? "Taux d'occupation" : "Revenus par categorie"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              {reportType === "occupation" ? (
                <BarChart data={data.chart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={data.chart || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {(data.chart || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Resume</h3>
            {data.summary && (
              <div className="space-y-3">
                {Object.entries(data.summary).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">{key}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune donnee disponible pour cette periode</p>
        </div>
      )}
    </div>
  );
}
