"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Plus } from "lucide-react";
import { useSafety } from "@/hooks/quality/useSafety";
import { useHotelStore } from "@/stores/hotel-store";
import { SAFETY_CATEGORIES, Q } from "@/lib/quality-theme";
import QualityCard from "@/components/quality/QualityCard";
import SectionLabel from "@/components/quality/SectionLabel";
import Tag from "@/components/quality/Tag";
import DateInput from "@/components/quality/DateInput";
import EmptyState from "@/components/quality/EmptyState";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  CONFORME: { color: Q.colors.ok, bg: Q.colors.okA },
  RESERVE: { color: Q.colors.warn, bg: Q.colors.warnA },
  EN_COURS: { color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  EXPIRE: { color: Q.colors.err, bg: Q.colors.errA },
};

const RESULT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  favorable: { color: Q.colors.ok, bg: Q.colors.okA, label: "Favorable" },
  defavorable: { color: Q.colors.err, bg: Q.colors.errA, label: "D\u00e9favorable" },
  favorable_avec_reserves: { color: Q.colors.warn, bg: Q.colors.warnA, label: "Favorable avec r\u00e9serves" },
};

export default function SecuritePage() {
  const router = useRouter();
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const { items, commissions, loading, updateItem, createCommission } = useSafety(hotelId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editDate, setEditDate] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formResult, setFormResult] = useState("favorable");
  const [formNextDate, setFormNextDate] = useState("");
  const [formPrescriptions, setFormPrescriptions] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdateItem = async (id: string) => {
    await updateItem(id, { status: editStatus, lastCheck: editDate } as Record<string, unknown>);
    setEditingId(null);
  };

  const handleCreateCommission = async () => {
    const prescriptions = formPrescriptions
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, resolved: false }));
    setSaving(true);
    try {
      await createCommission({
        date: formDate,
        result: formResult,
        nextVisitDate: formNextDate || undefined,
        prescriptions,
      } as Record<string, unknown>);
      setShowForm(false);
      setFormPrescriptions("");
    } finally {
      setSaving(false);
    }
  };

  const grouped = SAFETY_CATEGORIES.map((cat) => ({
    ...cat,
    matched: items.filter((it) => {
      const catId = (it as Record<string, unknown>).category;
      if (catId === cat.id) return true;
      return cat.items.some((ci) => ci.label === it.name);
    }),
  }));

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-lg font-bold text-[#1B2A4A]">S\u00e9curit\u00e9</h1>

      {loading && <p className="text-sm text-[#8E96A4]">Chargement...</p>}

      {/* Section 1: Registre de securite */}
      <div className="space-y-4">
        <SectionLabel>Registre de s\u00e9curit\u00e9</SectionLabel>
        {!loading && items.length === 0 && (
          <EmptyState icon={Shield} title="Aucun \u00e9l\u00e9ment" sub="Le registre est vide" />
        )}
        {grouped.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <p className="text-xs font-semibold text-[#5E6B80]">{cat.name}</p>
            {cat.matched.length === 0 && cat.items.map((ci) => (
              <QualityCard key={ci.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1B2A4A]">{ci.label}</p>
                    <p className="text-[11px] text-[#8E96A4]">{ci.freq}</p>
                  </div>
                  <Tag color={Q.colors.t3} bg={Q.colors.b2}>--</Tag>
                </div>
              </QualityCard>
            ))}
            {cat.matched.map((item) => {
              const st = STATUS_STYLES[(item as Record<string, unknown>).status as string] ?? STATUS_STYLES.EXPIRE;
              const lastCheck = (item as Record<string, unknown>).lastCheck as string | undefined;
              const isEditing = editingId === item.id;
              return (
                <QualityCard key={item.id} onClick={isEditing ? undefined : () => {
                  setEditingId(item.id);
                  setEditStatus(item.status);
                  setEditDate(lastCheck ?? new Date().toISOString().slice(0, 10));
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#1B2A4A]">{item.name}</p>
                      {lastCheck && (
                        <p className="text-[11px] text-[#8E96A4]">
                          Dernier: {new Date(lastCheck).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <Tag color={st.color} bg={st.bg}>{item.status.replace("_", " ")}</Tag>
                  </div>
                  {isEditing && (
                    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[#E2DDD5] pt-3">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-2 py-1.5 text-xs text-[#1B2A4A]"
                      >
                        {Object.keys(STATUS_STYLES).map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      <DateInput value={editDate} onChange={setEditDate} />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateItem(item.id); }}
                        className="rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        OK
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="text-xs text-[#8E96A4]"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </QualityCard>
              );
            })}
          </div>
        ))}
      </div>

      {/* Section 2: Commissions de securite */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Commissions de s\u00e9curit\u00e9</SectionLabel>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-xl bg-[#C8A96E] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {showForm && (
          <QualityCard accent={Q.colors.navy}>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5E6B80]">Date de visite</label>
                <DateInput value={formDate} onChange={setFormDate} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5E6B80]">R\u00e9sultat</label>
                <select
                  value={formResult}
                  onChange={(e) => setFormResult(e.target.value)}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-1.5 text-sm text-[#1B2A4A]"
                >
                  {Object.entries(RESULT_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5E6B80]">Prescriptions (une par ligne)</label>
                <textarea
                  value={formPrescriptions}
                  onChange={(e) => setFormPrescriptions(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5E6B80]">Prochaine visite</label>
                <DateInput value={formNextDate} onChange={setFormNextDate} />
              </div>
              <button
                onClick={handleCreateCommission}
                disabled={saving}
                className="w-full rounded-xl bg-[#1B2A4A] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </QualityCard>
        )}

        {!loading && commissions.length === 0 && !showForm && (
          <EmptyState icon={Shield} title="Aucune commission" sub="Ajoutez votre premi\u00e8re commission" />
        )}
        {commissions.map((c) => {
          const r = (c as Record<string, unknown>).result as string;
          const rs = RESULT_STYLES[r] ?? RESULT_STYLES.favorable;
          return (
            <QualityCard key={c.id} accent={rs.color} onClick={() => router.push(`/quality/securite/${c.id}`)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1B2A4A]">
                  {new Date(c.date).toLocaleDateString("fr-FR")}
                </p>
                <Tag color={rs.color} bg={rs.bg}>{rs.label}</Tag>
              </div>
            </QualityCard>
          );
        })}
      </div>
    </div>
  );
}
