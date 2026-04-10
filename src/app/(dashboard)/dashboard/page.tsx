"use client";

import { useEffect, useState } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  BedDouble, Users, ArrowUpRight, ArrowDownRight,
  Wrench, Sparkles, Ban, TrendingUp, DollarSign
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: any; color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { activeHotelId } = useHotelStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeHotelId) return;

    fetch(`/api/dashboard?hotelId=${activeHotelId}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setWeeklyData(data.weeklyOccupancy || []);
      })
      .finally(() => setLoading(false));
  }, [activeHotelId]);

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BedDouble className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Aucun hotel selectionne
        </h2>
        <p className="text-slate-500">
          Selectionnez un hotel dans la sidebar ou creez-en un nouveau.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 dark:text-slate-400">Vue d&apos;ensemble de votre hotel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Chambres totales" value={stats.totalRooms} icon={BedDouble} color="bg-slate-600" />
        <StatCard title="Disponibles" value={stats.available} icon={BedDouble} color="bg-emerald-500" />
        <StatCard title="Occupees" value={stats.occupied} subtitle={`${stats.occupancyRate}% d'occupation`} icon={Users} color="bg-red-500" />
        <StatCard title="Maintenance" value={stats.maintenance} icon={Wrench} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Arrivees du jour" value={stats.todayArrivals} icon={ArrowDownRight} color="bg-blue-500" />
        <StatCard title="Departs du jour" value={stats.todayDepartures} icon={ArrowUpRight} color="bg-purple-500" />
        <StatCard title="Menage en cours" value={stats.cleaning} icon={Sparkles} color="bg-cyan-500" />
        <StatCard title="Bloquees" value={stats.blocked} icon={Ban} color="bg-gray-500" />
      </div>

      {/* Revenue + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue cards */}
        <div className="space-y-4">
          <StatCard title="Revenu du jour" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} color="bg-emerald-600" />
          <StatCard title="Revenu semaine" value={formatCurrency(stats.weekRevenue)} icon={TrendingUp} color="bg-blue-600" />
          <StatCard title="Revenu mois" value={formatCurrency(stats.monthRevenue)} icon={TrendingUp} color="bg-indigo-600" />
        </div>

        {/* Weekly occupancy chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Occupation hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value) => [`${value}%`, "Occupation"]}
              />
              <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
