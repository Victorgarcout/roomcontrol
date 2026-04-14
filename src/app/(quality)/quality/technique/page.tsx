"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, Plus, X, Truck, Building2, BedDouble } from "lucide-react";
import { useHotelStore } from "@/stores/hotel-store";
import { useMaintenanceTickets } from "@/hooks/quality/useMaintenanceTickets";
import QualityCard from "@/components/quality/QualityCard";
import Tag from "@/components/quality/Tag";
import Pill from "@/components/quality/Pill";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";
import { Q } from "@/lib/quality-theme";

const SUB_TABS = ["Tickets", "Chambres Equip", "Fournisseurs", "Espaces Communs"] as const;
type SubTab = (typeof SUB_TABS)[number];
const PRIORITIES = ["Toutes", "HAUTE", "MOYENNE", "FAIBLE"] as const;
const PRIO_COLORS: Record<string, { color: string; bg: string }> = {
  HAUTE: { color: Q.colors.err, bg: Q.colors.errA },
  MOYENNE: { color: Q.colors.warn, bg: Q.colors.warnA },
  FAIBLE: { color: Q.colors.ok, bg: Q.colors.okA },
};
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  A_FAIRE: { color: Q.colors.t2, bg: Q.colors.b2 },
  EN_COURS: { color: Q.colors.warn, bg: Q.colors.warnA },
  TERMINE: { color: Q.colors.ok, bg: Q.colors.okA },
};

export default function TechniquePage() {
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const [tab, setTab] = useState<SubTab>("Tickets");
  const [prio, setPrio] = useState<string>("Toutes");
  const [showForm, setShowForm] = useState(false);

  const filters = prio === "Toutes" ? {} : { priority: prio };
  const { data: tickets, loading, createTicket } = useMaintenanceTickets(hotelId, filters);

  // Form state for new ticket
  const [form, setForm] = useState({ zone: "", equipment: "", problem: "", priority: "MOYENNE", cost: "", assignedTo: "" });

  const handleCreate = async () => {
    if (!form.zone || !form.equipment || !form.problem) return;
    await createTicket({ ...form, cost: form.cost ? Number(form.cost) : undefined } as Record<string, unknown>);
    setForm({ zone: "", equipment: "", problem: "", priority: "MOYENNE", cost: "", assignedTo: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1B2A4A]">Suivi Technique</h1>

      {/* Sub-tab pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {SUB_TABS.map((t) => (
          <Pill key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Pill>
        ))}
      </div>

      {/* ── Tickets Tab ── */}
      {tab === "Tickets" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Tickets maintenance</SectionLabel>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs font-semibold text-[#C8A96E]">
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "Fermer" : "Nouveau"}
            </button>
          </div>

          {/* Priority filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {PRIORITIES.map((p) => (
              <Pill key={p} active={prio === p} onClick={() => setPrio(p)}
                color={p === "Toutes" ? Q.colors.navy : PRIO_COLORS[p]?.color}>
                {p === "Toutes" ? "Toutes" : p.charAt(0) + p.slice(1).toLowerCase()}
              </Pill>
            ))}
          </div>

          {/* Add ticket form */}
          {showForm && (
            <QualityCard accent={Q.colors.sand}>
              <div className="space-y-2">
                <input placeholder="Zone" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs" />
                <input placeholder="Équipement" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs" />
                <input placeholder="Problème" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs" />
                <div className="flex gap-2">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="flex-1 rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs">
                    <option value="HAUTE">Haute</option>
                    <option value="MOYENNE">Moyenne</option>
                    <option value="FAIBLE">Faible</option>
                  </select>
                  <input placeholder="Coût €" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="w-24 rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs" />
                </div>
                <input placeholder="Assigné à" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs" />
                <button onClick={handleCreate}
                  className="w-full rounded-xl bg-[#1B2A4A] py-2 text-xs font-semibold text-white">
                  Créer le ticket
                </button>
              </div>
            </QualityCard>
          )}

          {/* Ticket list */}
          {loading ? (
            <p className="text-center text-xs text-[#8E96A4] py-8">Chargement...</p>
          ) : tickets.length === 0 ? (
            <EmptyState icon={Wrench} title="Aucun ticket" sub="Créez un ticket de maintenance" />
          ) : (
            tickets.map((t: Record<string, unknown>) => {
              const pr = PRIO_COLORS[t.priority as string] ?? PRIO_COLORS.MOYENNE;
              const st = STATUS_COLORS[t.status as string] ?? STATUS_COLORS.A_FAIRE;
              return (
                <QualityCard key={t.id as string} accent={pr.color}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1B2A4A]">{t.zone as string}</span>
                      <div className="flex gap-1">
                        <Tag color={pr.color} bg={pr.bg}>{t.priority as string}</Tag>
                        <Tag color={st.color} bg={st.bg}>{(t.status as string)?.replace("_", " ")}</Tag>
                      </div>
                    </div>
                    <p className="text-xs text-[#5E6B80]">{t.equipment as string} — {t.problem as string}</p>
                    {(t.cost as number) > 0 && (
                      <p className="text-[11px] font-medium text-[#C8A96E]">{t.cost as number} €</p>
                    )}
                  </div>
                </QualityCard>
              );
            })
          )}
        </div>
      )}

      {/* ── Chambres Equip Tab ── */}
      {tab === "Chambres Equip" && <RoomEquipTab hotelId={hotelId} />}

      {/* ── Fournisseurs Tab ── */}
      {tab === "Fournisseurs" && <SuppliersTab hotelId={hotelId} />}

      {/* ── Espaces Communs Tab ── */}
      {tab === "Espaces Communs" && <CommonAreasTab hotelId={hotelId} />}
    </div>
  );
}

/* ── Room Equipment sub-tab ── */
function RoomEquipTab({ hotelId }: { hotelId: string }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    fetch(`/api/quality/maintenance/room-equip?hotelId=${hotelId}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .finally(() => setLoading(false));
  }, [hotelId]);

  if (loading) return <p className="text-center text-xs text-[#8E96A4] py-8">Chargement...</p>;
  if (!items.length) return <EmptyState icon={BedDouble} title="Aucun contrôle chambre" sub="Allez dans Chambres pour en créer" />;

  return (
    <div className="space-y-2">
      <SectionLabel>Contrôles équipements chambres</SectionLabel>
      {items.map((item) => {
        const states = (item.equipStates ?? {}) as Record<string, string>;
        return (
          <QualityCard key={item.id as string}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#1B2A4A]">Ch. {item.roomNumber as string}</span>
                <span className="ml-2 text-[11px] text-[#8E96A4]">
                  {new Date(item.checkDate as string).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex gap-1">
                {Object.values(states).map((s, i) => (
                  <span key={i} className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s === "BON" ? Q.colors.ok : s === "DEGRADE" ? Q.colors.warn : Q.colors.err }} />
                ))}
              </div>
            </div>
          </QualityCard>
        );
      })}
    </div>
  );
}

/* ── Suppliers sub-tab ── */
function SuppliersTab({ hotelId }: { hotelId: string }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    fetch(`/api/quality/maintenance/suppliers?hotelId=${hotelId}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .finally(() => setLoading(false));
  }, [hotelId]);

  const isOverdue = (lastCheck: string | undefined, frequency: string) => {
    if (!lastCheck) return true;
    const last = new Date(lastCheck);
    const now = new Date();
    const freqDays: Record<string, number> = {
      Mensuelle: 30, Trimestrielle: 90, Semestrielle: 180, Annuelle: 365, Quinquennale: 1825,
    };
    const days = freqDays[frequency] ?? 365;
    return (now.getTime() - last.getTime()) / 86400000 > days;
  };

  if (loading) return <p className="text-center text-xs text-[#8E96A4] py-8">Chargement...</p>;
  if (!items.length) return <EmptyState icon={Truck} title="Aucun fournisseur" sub="Ajoutez des suivis fournisseurs" />;

  return (
    <div className="space-y-2">
      <SectionLabel>Suivi fournisseurs</SectionLabel>
      {items.map((item) => {
        const overdue = isOverdue(item.lastCheck as string | undefined, item.frequency as string);
        return (
          <QualityCard key={item.id as string} accent={overdue ? Q.colors.err : Q.colors.ok}>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1B2A4A]">{item.equipment as string}</span>
                {overdue && <Tag color={Q.colors.err} bg={Q.colors.errA}>En retard</Tag>}
              </div>
              <p className="text-[11px] text-[#5E6B80]">
                Fournisseur: {(item.supplier as string) || "—"} · Fréq: {item.frequency as string}
              </p>
              <p className="text-[11px] text-[#8E96A4]">
                Dernier contrôle: {item.lastCheck ? new Date(item.lastCheck as string).toLocaleDateString("fr-FR") : "Jamais"}
              </p>
            </div>
          </QualityCard>
        );
      })}
    </div>
  );
}

/* ── Common Areas sub-tab ── */
function CommonAreasTab({ hotelId }: { hotelId: string }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    fetch(`/api/quality/maintenance/common-areas?hotelId=${hotelId}`)
      .then((r) => r.json())
      .then((j) => setItems(j.data ?? []))
      .finally(() => setLoading(false));
  }, [hotelId]);

  if (loading) return <p className="text-center text-xs text-[#8E96A4] py-8">Chargement...</p>;
  if (!items.length) return <EmptyState icon={Building2} title="Aucun contrôle" sub="Ajoutez un contrôle espace commun" />;

  return (
    <div className="space-y-2">
      <SectionLabel>Espaces communs</SectionLabel>
      {items.map((item) => {
        const states = (item.checkStates ?? {}) as Record<string, string>;
        return (
          <QualityCard key={item.id as string}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#1B2A4A]">{item.areaName as string}</span>
                <span className="ml-2 text-[11px] text-[#8E96A4]">
                  {new Date(item.checkDate as string).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex gap-1">
                {Object.values(states).map((s, i) => (
                  <span key={i} className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s === "BON" ? Q.colors.ok : s === "DEGRADE" ? Q.colors.warn : Q.colors.err }} />
                ))}
              </div>
            </div>
          </QualityCard>
        );
      })}
    </div>
  );
}
