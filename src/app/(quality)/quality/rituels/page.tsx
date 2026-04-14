"use client";

import { useState, useMemo } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { useRituals } from "@/hooks/quality/useRituals";
import { RITUALS } from "@/lib/quality-theme";
import Tag from "@/components/quality/Tag";
import ProgressBar from "@/components/quality/ProgressBar";
import SectionLabel from "@/components/quality/SectionLabel";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const FREQ_COLORS: Record<string, { color: string; bg: string }> = {
  Quotidien: { color: "#1B2A4A", bg: "#EDE9E3" },
  Hebdo: { color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  Mensuel: { color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  "Bi-mensuel": { color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  Trimestriel: { color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  Biannuel: { color: "#1B2A4A", bg: "rgba(27,42,74,0.10)" },
  Constant: { color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
};

export default function RituelsPage() {
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const monday = getMonday(new Date());
    monday.setDate(monday.getDate() + weekOffset * 7);
    return monday;
  }, [weekOffset]);

  const weekStartStr = formatDate(weekStart);

  const { data, loading, toggleRitual } = useRituals(hotelId, { weekStart: weekStartStr });

  const completedSet = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.completed) set.add(r.name);
    });
    return set;
  }, [data]);

  const completedCount = RITUALS.filter((r) => completedSet.has(r.id)).length;

  const handleToggle = (ritualKey: string) => {
    const isCompleted = completedSet.has(ritualKey);
    toggleRitual({ ritualKey, weekStart: weekStartStr, completed: !isCompleted });
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pb-12 pt-6">
      <h1 className="text-lg font-bold text-[#1B2A4A]">Rituels qualit\u00e9</h1>

      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-[#E2DDD5]">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1B2A4A] transition-colors hover:bg-[#F5F3EE]"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-[#1B2A4A]">
          Semaine du {formatDateFR(weekStart)} au {formatDateFR(weekEnd)}
        </span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1B2A4A] transition-colors hover:bg-[#F5F3EE]"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <SectionLabel>
          Progression : {completedCount}/{RITUALS.length} rituels
        </SectionLabel>
        <ProgressBar value={completedCount} max={RITUALS.length} color="#16A34A" />
      </div>

      {/* Rituals list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[#8E96A4]">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {RITUALS.map((ritual) => {
            const done = completedSet.has(ritual.id);
            const freq = FREQ_COLORS[ritual.freq] ?? FREQ_COLORS.Hebdo;

            return (
              <button
                key={ritual.id}
                type="button"
                onClick={() => handleToggle(ritual.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  done
                    ? "border-green-200 bg-green-50/60"
                    : "border-[#E2DDD5] bg-white hover:bg-[#F5F3EE]"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={22} className="shrink-0 text-[#16A34A]" />
                ) : (
                  <Circle size={22} className="shrink-0 text-[#D1D5DB]" />
                )}
                <span
                  className={`flex-1 text-sm font-medium ${
                    done ? "text-[#16A34A] line-through" : "text-[#1B2A4A]"
                  }`}
                >
                  {ritual.label}
                </span>
                <Tag color={freq.color} bg={freq.bg}>
                  {ritual.freq}
                </Tag>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
