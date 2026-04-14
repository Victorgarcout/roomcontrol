"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, Plus, ArrowLeft } from "lucide-react";
import { useAudit } from "@/hooks/quality/useAudit";
import { useHotelStore } from "@/stores/hotel-store";
import { AUDIT_ZONES, Q } from "@/lib/quality-theme";
import QualityCard from "@/components/quality/QualityCard";
import SectionLabel from "@/components/quality/SectionLabel";
import NoteButton from "@/components/quality/NoteButton";
import DateInput from "@/components/quality/DateInput";
import EmptyState from "@/components/quality/EmptyState";

const SCORE_COLORS = ["", Q.colors.err, Q.colors.warn, "#84CC16", Q.colors.ok];

type FormScores = Record<string, Record<string, { score: number; notes: string }>>;

export default function AuditPage() {
  const router = useRouter();
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const { data: audits, loading, createAudit } = useAudit(hotelId);
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [scores, setScores] = useState<FormScores>({});
  const [saving, setSaving] = useState(false);

  const setItemScore = (zone: string, item: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [item]: { ...prev[zone]?.[item], score, notes: prev[zone]?.[item]?.notes ?? "" } },
    }));
  };

  const setItemNotes = (zone: string, item: string, notes: string) => {
    setScores((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [item]: { ...prev[zone]?.[item], notes, score: prev[zone]?.[item]?.score ?? 0 } },
    }));
  };

  const handleSave = async () => {
    const items = AUDIT_ZONES.flatMap((z) =>
      z.items.map((item) => ({
        category: z.id,
        question: item,
        score: scores[z.id]?.[item]?.score ?? 0,
        notes: scores[z.id]?.[item]?.notes ?? "",
      }))
    );
    setSaving(true);
    try {
      await createAudit({ date, items });
      setCreating(false);
      setScores({});
    } finally {
      setSaving(false);
    }
  };

  const computeGlobalScore = (items?: { score: number }[]) => {
    if (!items || items.length === 0) return 0;
    const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
    return Math.round((avg / 4) * 100);
  };

  if (creating) {
    return (
      <div className="space-y-4 pb-8">
        <button onClick={() => setCreating(false)} className="flex items-center gap-1 text-sm text-[#5E6B80]">
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-lg font-bold text-[#1B2A4A]">Nouvel Audit</h1>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#5E6B80]">Date</label>
          <DateInput value={date} onChange={setDate} />
        </div>
        {AUDIT_ZONES.map((zone) => (
          <div key={zone.id} className="space-y-2">
            <SectionLabel>{zone.name}</SectionLabel>
            {zone.items.map((item) => (
              <QualityCard key={`${zone.id}-${item}`}>
                <p className="mb-2 text-sm font-medium text-[#1B2A4A]">{item}</p>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <NoteButton
                      key={n}
                      active={scores[zone.id]?.[item]?.score === n}
                      color={SCORE_COLORS[n]}
                      onClick={() => setItemScore(zone.id, item, n)}
                    >
                      {n}
                    </NoteButton>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Commentaire..."
                  value={scores[zone.id]?.[item]?.notes ?? ""}
                  onChange={(e) => setItemNotes(zone.id, item, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-1.5 text-xs text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
                />
              </QualityCard>
            ))}
          </div>
        ))}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[#1B2A4A] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer l'audit"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#1B2A4A]">Audit Global</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#C8A96E] px-4 py-2 text-xs font-semibold text-white"
        >
          <Plus size={14} /> Lancer un audit
        </button>
      </div>
      {loading && <p className="text-sm text-[#8E96A4]">Chargement...</p>}
      {!loading && audits.length === 0 && (
        <EmptyState icon={ClipboardCheck} title="Aucun audit" sub="Lancez votre premier audit qualit&eacute;" />
      )}
      <div className="space-y-3">
        {audits.map((audit) => (
          <QualityCard key={audit.id} accent={Q.colors.sand} onClick={() => router.push(`/quality/audit/${audit.id}`)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1B2A4A]">
                  {new Date(audit.date).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs text-[#8E96A4]">
                  {(audit as Record<string, unknown>).auditorName
                    ? String((audit as Record<string, unknown>).auditorName)
                    : "Auditeur"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#1B2A4A]">
                  {computeGlobalScore(audit.items)}<span className="text-xs text-[#8E96A4]">/100</span>
                </p>
              </div>
            </div>
          </QualityCard>
        ))}
      </div>
    </div>
  );
}
