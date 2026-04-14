"use client";

import { useState, useMemo } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { usePerformance } from "@/hooks/quality/usePerformance";
import { MONTHS_FR, Q } from "@/lib/quality-theme";
import Pill from "@/components/quality/Pill";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";
import { Hotel, Save, Sparkles, PartyPopper } from "lucide-react";

const YEAR = new Date().getFullYear();

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "rps", label: "RPS" },
  { key: "rpsN1", label: "RPS N-1" },
  { key: "compIndex", label: "CompIndex" },
  { key: "nbAvis", label: "Nb avis" },
  { key: "tauxReponse", label: "Taux reponse (%)" },
];

export default function PerformancePage() {
  const activeHotelId = useHotelStore((s) => s.activeHotelId);
  const [year] = useState(YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [saving, setSaving] = useState(false);

  const { data, loading, upsertPerformance } = usePerformance(activeHotelId ?? "", { year, limit: 12 });

  const record = useMemo(
    () => data.find((d) => d.month === month + 1) ?? null,
    [data, month],
  );

  const [form, setForm] = useState<Record<string, unknown>>({});

  // Sync form when record or month changes
  const formKey = `${activeHotelId}-${year}-${month}`;
  const [prevKey, setPrevKey] = useState("");
  if (formKey !== prevKey) {
    setPrevKey(formKey);
    setForm(record ? { ...record } : {});
  }

  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!activeHotelId) return;
    setSaving(true);
    try {
      await upsertPerformance({ ...form, year, month: month + 1 });
    } finally {
      setSaving(false);
    }
  };

  if (!activeHotelId) {
    return (
      <div className="font-outfit min-h-screen bg-[#F5F3EE] p-6">
        <EmptyState icon={Hotel} title="Aucun hotel selectionne" sub="Choisissez un hotel pour commencer." />
      </div>
    );
  }

  return (
    <div className="font-outfit min-h-screen bg-[#F5F3EE]">
      <div className="px-5 pb-24 pt-6">
        <h1 className="mb-4 text-lg font-bold text-[#1B2A4A]">Performance TrustYou</h1>

        {/* Month selector */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {MONTHS_FR.map((m, i) => (
            <Pill key={i} active={i === month} onClick={() => setMonth(i)} color={Q.colors.navy}>
              {m}
            </Pill>
          ))}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-[#E2DDD5]" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Numeric fields */}
            <SectionLabel>Indicateurs</SectionLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[#8E96A4]">{f.label}</span>
                  <input
                    type="number"
                    step="any"
                    value={form[f.key] != null ? String(form[f.key]) : ""}
                    onChange={(e) => set(f.key, e.target.value === "" ? null : Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                  />
                </label>
              ))}
            </div>

            {/* Negative impacts */}
            <SectionLabel>Top 3 impacts negatifs</SectionLabel>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Impact negatif ${i + 1}`}
                  value={String((form.negImpacts as string[] | undefined)?.[i] ?? "")}
                  onChange={(e) => {
                    const arr = [...((form.negImpacts as string[]) ?? ["", "", ""])];
                    arr[i] = e.target.value;
                    set("negImpacts", arr);
                  }}
                  className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              ))}
            </div>

            {/* Positive impacts */}
            <SectionLabel>Top 3 impacts positifs</SectionLabel>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  type="text"
                  placeholder={`Impact positif ${i + 1}`}
                  value={String((form.posImpacts as string[] | undefined)?.[i] ?? "")}
                  onChange={(e) => {
                    const arr = [...((form.posImpacts as string[]) ?? ["", "", ""])];
                    arr[i] = e.target.value;
                    set("posImpacts", arr);
                  }}
                  className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              ))}
            </div>

            {/* Sparkles & Animations */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#8E96A4]">
                  <Sparkles size={12} /> Sparkles
                </span>
                <input
                  type="number" min={0}
                  value={form.sparkles != null ? String(form.sparkles) : ""}
                  onChange={(e) => set("sparkles", e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#8E96A4]">
                  <PartyPopper size={12} /> Animations
                </span>
                <input
                  type="number" min={0}
                  value={form.animations != null ? String(form.animations) : ""}
                  onChange={(e) => set("animations", e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              </label>
            </div>

            {/* Comments */}
            <SectionLabel>Commentaires</SectionLabel>
            <textarea
              rows={3}
              placeholder="Notes du mois..."
              value={String(form.comments ?? "")}
              onChange={(e) => set("comments", e.target.value)}
              className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
            />

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: Q.colors.navy }}
            >
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
