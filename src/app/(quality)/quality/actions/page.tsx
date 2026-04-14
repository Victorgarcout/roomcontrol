"use client";

import { useState, useMemo } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { useActions } from "@/hooks/quality/useActions";
import Pill from "@/components/quality/Pill";
import Tag from "@/components/quality/Tag";
import QualityCard from "@/components/quality/QualityCard";
import ProgressBar from "@/components/quality/ProgressBar";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";
import DateInput from "@/components/quality/DateInput";
import { Plus, ClipboardList, X } from "lucide-react";

const CATEGORIES = [
  { key: "", label: "Toutes" },
  { key: "CHAMBRE", label: "Chambre", color: "#1B2A4A" },
  { key: "PROPRETE", label: "Propreté", color: "#16A34A" },
  { key: "EQUIPEMENT", label: "Équipement", color: "#D97706" },
  { key: "MAINTENANCE", label: "Maintenance", color: "#DC2626" },
];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  TODO: { color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  IN_PROGRESS: { color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  DONE: { color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Fait",
};

const CAT_COLOR: Record<string, string> = {
  CHAMBRE: "#1B2A4A",
  PROPRETE: "#16A34A",
  EQUIPEMENT: "#D97706",
  MAINTENANCE: "#DC2626",
};

export default function ActionsPage() {
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, loading, createAction, updateAction } = useActions(hotelId, {
    category: catFilter || undefined,
    status: statusFilter || undefined,
  });

  const [form, setForm] = useState({
    category: "CHAMBRE",
    text: "",
    owner: "",
    dueDate: "",
    score: "",
    budget: "",
  });

  const progress = useMemo(() => {
    const done = data.filter((a) => a.status === "DONE").length;
    return { done, total: data.length };
  }, [data]);

  const isOverdue = (d?: string | null) => {
    if (!d) return false;
    return new Date(d) < new Date();
  };

  const cycleStatus = (action: { id: string; status: string }) => {
    const next = action.status === "TODO" ? "IN_PROGRESS" : action.status === "IN_PROGRESS" ? "DONE" : "TODO";
    updateAction(action.id, { status: next });
  };

  const handleSubmit = async () => {
    if (!form.text.trim() || !form.owner.trim()) return;
    await createAction({
      hotelId,
      text: form.text,
      category: form.category,
      owner: form.owner,
      ...(form.dueDate && { dueDate: new Date(form.dueDate).toISOString() }),
      ...(form.score && { score: Number(form.score) }),
      ...(form.budget && { budget: Number(form.budget) }),
    });
    setForm({ category: "CHAMBRE", text: "", owner: "", dueDate: "", score: "", budget: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1B2A4A]">Plan d&apos;action</h1>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Pill key={c.key} active={catFilter === c.key} onClick={() => setCatFilter(c.key)} color={c.color ?? "#1B2A4A"}>
            {c.label}
          </Pill>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "TODO", "IN_PROGRESS", "DONE"].map((s) => (
          <Pill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} color="#5E6B80">
            {s ? STATUS_LABEL[s] : "Tous"}
          </Pill>
        ))}
      </div>

      <div className="space-y-1">
        <SectionLabel>Progression : {progress.done}/{progress.total} actions</SectionLabel>
        <ProgressBar value={progress.done} max={progress.total || 1} color="#16A34A" />
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#8E96A4]">Chargement...</p>
      ) : data.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune action" sub="Ajoutez une action pour commencer" />
      ) : (
        <div className="space-y-3">
          {data.map((action) => (
            <QualityCard key={action.id} accent={CAT_COLOR[action.category] ?? "#C8A96E"} onClick={() => cycleStatus(action)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color={CAT_COLOR[action.category] ?? "#1B2A4A"}>
                      {CATEGORIES.find((c) => c.key === action.category)?.label ?? action.category}
                    </Tag>
                    {action.score != null && (
                      <span className="text-xs font-semibold text-[#1B2A4A]">{action.score}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[#1B2A4A]">{action.text}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E96A4]">
                    {action.dueDate && (
                      <span className={isOverdue(action.dueDate) && action.status !== "DONE" ? "font-semibold text-[#DC2626]" : ""}>
                        {new Date(action.dueDate).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {action.owner && <span>{action.owner}</span>}
                  </div>
                </div>
                <Tag color={STATUS_COLORS[action.status]?.color ?? "#5E6B80"} bg={STATUS_COLORS[action.status]?.bg ?? "#EDE9E3"}>
                  {STATUS_LABEL[action.status] ?? action.status}
                </Tag>
              </div>
            </QualityCard>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1B2A4A]">Nouvelle action</h2>
              <button onClick={() => setShowForm(false)} className="text-[#8E96A4]"><X size={20} /></button>
            </div>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm text-[#1B2A4A]"
            >
              {CATEGORIES.filter((c) => c.key).map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <input
              placeholder="Description de l'action"
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm text-[#1B2A4A] placeholder:text-[#8E96A4]"
            />
            <input
              placeholder="Responsable"
              value={form.owner}
              onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm text-[#1B2A4A] placeholder:text-[#8E96A4]"
            />
            <DateInput value={form.dueDate} onChange={(v) => setForm((f) => ({ ...f, dueDate: v }))} />
            <div className="flex gap-3">
              <input placeholder="Score" type="number" value={form.score}
                onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
                className="w-1/2 rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm text-[#1B2A4A] placeholder:text-[#8E96A4]" />
              <input placeholder="Budget" type="number" value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="w-1/2 rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm text-[#1B2A4A] placeholder:text-[#8E96A4]" />
            </div>
            <button onClick={handleSubmit}
              className="w-full rounded-xl bg-[#1B2A4A] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#253759]">
              Ajouter
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B2A4A] text-white shadow-lg transition-transform hover:scale-105">
        <Plus size={24} />
      </button>
    </div>
  );
}
