"use client";

import { useEffect, useState, useCallback } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { RoomWithCategory, ROOM_STATUS_CONFIG, RoomStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  BedDouble, Grid3X3, List, ChevronDown, Users, Loader2
} from "lucide-react";

const STATUS_OPTIONS: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "CLEANING", "BLOCKED"];

function RoomCard({ room, onStatusChange }: { room: RoomWithCategory; onStatusChange: (roomId: string, status: RoomStatus) => void }) {
  const config = ROOM_STATUS_CONFIG[room.status];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={`relative bg-white dark:bg-slate-800 rounded-xl border-2 ${config.bg} border-opacity-50 p-4 hover:shadow-lg transition-shadow cursor-pointer`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">#{room.number}</h3>
          <p className="text-sm text-slate-500">{room.category.name}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{room.category.capacity} pers.</span>
        </div>
        <p className="font-medium text-slate-900 dark:text-white">
          {formatCurrency(room.category.price)}/nuit
        </p>
        <p className="text-xs">Etage {room.floor}</p>
      </div>

      {room.currentBooking && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {room.currentBooking.guest.firstName} {room.currentBooking.guest.lastName}
          </p>
        </div>
      )}

      {/* Quick status change */}
      <div className="mt-3 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full text-xs py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1 transition"
        >
          Changer statut <ChevronDown className="w-3 h-3" />
        </button>
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 py-1">
            {STATUS_OPTIONS.filter((s) => s !== room.status).map((status) => {
              const sc = ROOM_STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => { onStatusChange(room.id, status); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${sc.bg}`} />
                  {sc.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { activeHotelId } = useHotelStore();
  const [rooms, setRooms] = useState<RoomWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterFloor, setFilterFloor] = useState<string>("");

  const fetchRooms = useCallback(async () => {
    if (!activeHotelId) return;
    setLoading(true);
    const params = new URLSearchParams({ hotelId: activeHotelId });
    if (filterStatus) params.set("status", filterStatus);
    if (filterFloor) params.set("floor", filterFloor);

    const res = await fetch(`/api/rooms?${params}`);
    const data = await res.json();
    setRooms(data);
    setLoading(false);
  }, [activeHotelId, filterStatus, filterFloor]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const handleStatusChange = async (roomId: string, status: RoomStatus) => {
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, status }),
    });
    fetchRooms();
  };

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BedDouble className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Selectionnez un hotel</h2>
      </div>
    );
  }

  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chambres</h1>
          <p className="text-slate-500">{rooms.length} chambres</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{ROOM_STATUS_CONFIG[s].label}</option>
            ))}
          </select>

          {/* Floor filter */}
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="">Tous les etages</option>
            {floors.map((f) => (
              <option key={f} value={f}>Etage {f}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 ${view === "list" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3">
        {STATUS_OPTIONS.map((status) => {
          const config = ROOM_STATUS_CONFIG[status];
          const count = rooms.filter((r) => r.status === status).length;
          return (
            <div key={status} className="flex items-center gap-1.5 text-sm">
              <span className={`w-3 h-3 rounded-full ${config.bg}`} />
              <span className="text-slate-600 dark:text-slate-400">{config.label}</span>
              <span className="font-medium text-slate-900 dark:text-white">({count})</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onStatusChange={handleStatusChange} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chambre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Categorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Etage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Prix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {rooms.map((room) => {
                const config = ROOM_STATUS_CONFIG[room.status];
                return (
                  <tr key={room.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">#{room.number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{room.category.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{room.floor}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(room.category.price)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {room.currentBooking ? `${room.currentBooking.guest.firstName} ${room.currentBooking.guest.lastName}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
