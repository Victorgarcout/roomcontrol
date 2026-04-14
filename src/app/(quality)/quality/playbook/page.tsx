"use client";

import { useState } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { usePlaybook } from "@/hooks/quality/usePlaybook";
import { Q, PLAYBOOK_EVENTS, PLAYBOOK_BOOSTS, PLAYBOOK_SEASONS, MONTHS_FR } from "@/lib/quality-theme";
import Pill from "@/components/quality/Pill";
import SectionLabel from "@/components/quality/SectionLabel";
import QualityCard from "@/components/quality/QualityCard";
import Tag from "@/components/quality/Tag";
import EmptyState from "@/components/quality/EmptyState";
import { BookOpen, Plus, CalendarDays, Sun, Snowflake, Repeat, Zap } from "lucide-react";

const TABS = ["Calendrier", "Saisons", "Boosters"] as const;
type Tab = (typeof TABS)[number];

const TYPE_COLORS: Record<string, { color: string; label: string }> = {
  deco: { color: "#7C3AED", label: "Déco" },
  food: { color: "#D97706", label: "Food" },
  event: { color: "#0D9488", label: "Event" },
};
const EFFORT: Record<string, { color: string; label: string }> = {
  low: { color: "#16A34A", label: "Facile" },
  med: { color: "#D97706", label: "Moyen" },
  high: { color: "#DC2626", label: "Intensif" },
};
const SEASON_SECTIONS = [
  { key: "summer" as const, label: "Été", icon: Sun, typePrefix: "season_summer" },
  { key: "winter" as const, label: "Hiver", icon: Snowflake, typePrefix: "season_winter" },
  { key: "allYear" as const, label: "Toute l'année", icon: Repeat, typePrefix: "season_allYear" },
];

export default function PlaybookPage() {
  const [tab, setTab] = useState<Tab>("Calendrier");
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const { data: entries, createEntry } = usePlaybook(hotelId);
  const now = new Date();

  if (!hotelId) {
    return (
      <div className="font-outfit min-h-screen bg-[#F5F3EE] p-6">
        <EmptyState icon={BookOpen} title="Aucun hôtel sélectionné" sub="Choisissez un hôtel pour accéder au playbook." />
      </div>
    );
  }

  const prompt = (label: string) => {
    const v = window.prompt(label);
    return v?.trim() || null;
  };

  /* ── Calendrier ── */
  const grouped = PLAYBOOK_EVENTS.reduce<Record<number, typeof PLAYBOOK_EVENTS>>((acc, e) => {
    (acc[e.m] ??= []).push(e);
    return acc;
  }, {});
  const customEvents = entries.filter((e) => e.type === "event");

  const renderCalendrier = () => (
    <div className="space-y-5">
      {Object.entries(grouped)
        .sort(([a], [b]) => +a - +b)
        .map(([m, evts]) => {
          const mi = +m;
          const isCurrent = mi === now.getMonth();
          return (
            <div key={m}>
              <SectionLabel>
                <span style={isCurrent ? { color: Q.colors.sand } : undefined}>{MONTHS_FR[mi]}</span>
              </SectionLabel>
              <div className="mt-2 space-y-2">
                {evts.map((ev) => {
                  const tc = TYPE_COLORS[ev.type] ?? TYPE_COLORS.event;
                  const soon = isCurrent && ev.d >= now.getDate();
                  return (
                    <QualityCard key={ev.name} accent={soon ? Q.colors.sand : Q.colors.b1}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold" style={{ color: Q.colors.t1 }}>
                            {ev.d} {MONTHS_FR[mi]} — {ev.name}
                          </p>
                          <p className="mt-0.5 text-[11px]" style={{ color: Q.colors.t2 }}>{ev.tip}</p>
                        </div>
                        <Tag color={tc.color} bg={`${tc.color}1A`}>{tc.label}</Tag>
                      </div>
                    </QualityCard>
                  );
                })}
              </div>
            </div>
          );
        })}
      {customEvents.map((ce) => (
        <QualityCard key={ce.id} accent={Q.colors.info}>
          <p className="text-xs font-bold" style={{ color: Q.colors.t1 }}>{ce.title}</p>
          {ce.content && <p className="text-[11px]" style={{ color: Q.colors.t2 }}>{ce.content}</p>}
        </QualityCard>
      ))}
      <button
        onClick={() => {
          const t = prompt("Nom de l'événement");
          if (t) createEntry({ title: t, type: "event" });
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-xs font-semibold"
        style={{ borderColor: Q.colors.sand, color: Q.colors.sand }}
      >
        <Plus size={14} /> Ajouter un événement
      </button>
    </div>
  );

  /* ── Saisons ── */
  const renderSaisons = () => (
    <div className="space-y-6">
      {SEASON_SECTIONS.map(({ key, label, icon: Icon, typePrefix }) => {
        const items = PLAYBOOK_SEASONS[key];
        const customs = entries.filter((e) => e.type === typePrefix);
        return (
          <div key={key}>
            <SectionLabel><Icon size={12} className="mr-1 inline" />{label}</SectionLabel>
            <div className="mt-2 space-y-1.5">
              {items.map((item) => (
                <label key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[#EDE9E3]" style={{ color: Q.colors.t1 }}>
                  <input type="checkbox" className="accent-[#C8A96E]" /> {item}
                </label>
              ))}
              {customs.map((c) => (
                <label key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[#EDE9E3]" style={{ color: Q.colors.info }}>
                  <input type="checkbox" className="accent-[#7C3AED]" /> {c.title}
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                const t = prompt(`Nouvel item ${label}`);
                if (t) createEntry({ title: t, type: typePrefix });
              }}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: Q.colors.sand }}
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>
        );
      })}
    </div>
  );

  /* ── Boosters ── */
  const customBoosters = entries.filter((e) => e.type === "boost");

  const renderBoosters = () => (
    <div className="space-y-2">
      {PLAYBOOK_BOOSTS.map((b) => {
        const ef = EFFORT[b.effort] ?? EFFORT.low;
        return (
          <QualityCard key={b.text} accent={ef.color}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs" style={{ color: Q.colors.t1 }}>{b.text}</p>
              <Tag color={ef.color} bg={`${ef.color}1A`}>{ef.label}</Tag>
            </div>
          </QualityCard>
        );
      })}
      {customBoosters.map((cb) => (
        <QualityCard key={cb.id} accent={Q.colors.info}>
          <p className="text-xs" style={{ color: Q.colors.t1 }}>{cb.title}</p>
        </QualityCard>
      ))}
      <button
        onClick={() => {
          const t = prompt("Idée de booster");
          if (t) createEntry({ title: t, type: "boost" });
        }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-xs font-semibold"
        style={{ borderColor: Q.colors.sand, color: Q.colors.sand }}
      >
        <Plus size={14} /> Ajouter un booster
      </button>
    </div>
  );

  const ICONS = { Calendrier: CalendarDays, Saisons: Sun, Boosters: Zap };

  return (
    <div className="font-outfit min-h-screen bg-[#F5F3EE]">
      <div className="px-5 pb-24 pt-6">
        <h1 className="mb-4 text-lg font-bold" style={{ color: Q.colors.navy }}>Playbook Animations</h1>
        <div className="mb-5 flex gap-2">
          {TABS.map((t) => (
            <Pill key={t} active={tab === t} onClick={() => setTab(t)} color={Q.colors.navy}>
              {t}
            </Pill>
          ))}
        </div>
        {tab === "Calendrier" && renderCalendrier()}
        {tab === "Saisons" && renderSaisons()}
        {tab === "Boosters" && renderBoosters()}
      </div>
    </div>
  );
}
