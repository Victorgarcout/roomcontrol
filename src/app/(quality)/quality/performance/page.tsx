"use client";

import { useState, useMemo, useRef } from "react";
import { useHotelStore } from "@/stores/hotel-store";
import { usePerformance } from "@/hooks/quality/usePerformance";
import { MONTHS_FR, Q } from "@/lib/quality-theme";
import Pill from "@/components/quality/Pill";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";
import { Hotel, Save, Sparkles, PartyPopper, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

const YEAR = new Date().getFullYear();

const FIELDS: { key: string; label: string }[] = [
  { key: "rps", label: "RPS" },
  { key: "rpsN1", label: "RPS N-1" },
  { key: "compIndex", label: "CompIndex" },
  { key: "nbReviews", label: "Nb avis" },
  { key: "responseRate", label: "Taux reponse (%)" },
];

export default function PerformancePage() {
  const activeHotelId = useHotelStore((s) => s.activeHotelId);
  const [year] = useState(YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [saving, setSaving] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; errors: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, loading, upsertPerformance, refresh } = usePerformance(activeHotelId ?? "", { year, limit: 12 });

  const record = useMemo(
    () => data.find((d: any) => d.month === month + 1) ?? null,
    [data, month],
  );

  const [form, setForm] = useState<Record<string, unknown>>({});

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeHotelId) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("hotelId", activeHotelId);
      const res = await fetch("/api/quality/performance/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (res.ok) {
        setUploadResult({ imported: json.imported, errors: json.errors });
        refresh();
      } else {
        setUploadResult({ imported: 0, errors: 1 });
      }
    } catch {
      setUploadResult({ imported: 0, errors: 1 });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!activeHotelId) {
    return <EmptyState icon={Hotel} title="Aucun hotel selectionne" sub="Choisissez un hotel pour commencer." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1B2A4A]">Performance</h1>

      {/* Excel import/export bar */}
      <div className="flex items-center gap-2 rounded-[14px] border border-[#EDE9E3] bg-white p-3">
        <FileSpreadsheet size={18} className="text-[#16A34A]" />
        <span className="flex-1 text-xs font-medium text-[#5E6B80]">Import Excel</span>
        <a
          href="/api/quality/performance/template"
          className="flex items-center gap-1 rounded-lg border border-[#E2DDD5] px-3 py-1.5 text-[11px] font-semibold text-[#5E6B80] hover:bg-[#F5F3EE] transition-colors"
        >
          <Download size={13} /> Template
        </a>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-lg bg-[#1B2A4A] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#253759] transition-colors disabled:opacity-50"
        >
          <Upload size={13} /> {uploading ? "Import..." : "Importer"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Upload result */}
      {uploadResult && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium ${
          uploadResult.errors > 0 ? "bg-[rgba(220,38,38,0.08)] text-[#DC2626]" : "bg-[rgba(22,163,74,0.08)] text-[#16A34A]"
        }`}>
          {uploadResult.errors > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {uploadResult.imported} mois importé(s){uploadResult.errors > 0 && `, ${uploadResult.errors} erreur(s)`}
        </div>
      )}

      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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

          <SectionLabel>Top 3 impacts négatifs</SectionLabel>
          <div className="space-y-2">
            {(["negImpact1", "negImpact2", "negImpact3"] as const).map((key, i) => (
              <input
                key={key}
                type="text"
                placeholder={`Impact négatif ${i + 1}`}
                value={String(form[key] ?? "")}
                onChange={(e) => set(key, e.target.value || null)}
                className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
              />
            ))}
          </div>

          <SectionLabel>Top 3 impacts positifs</SectionLabel>
          <div className="space-y-2">
            {(["posImpact1", "posImpact2", "posImpact3"] as const).map((key, i) => (
              <input
                key={key}
                type="text"
                placeholder={`Impact positif ${i + 1}`}
                value={String(form[key] ?? "")}
                onChange={(e) => set(key, e.target.value || null)}
                className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
              />
            ))}
          </div>

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

          <SectionLabel>Commentaires</SectionLabel>
          <textarea
            rows={3}
            placeholder="Notes du mois..."
            value={String(form.comments ?? "")}
            onChange={(e) => set("comments", e.target.value)}
            className="w-full rounded-xl border border-[#E2DDD5] bg-white px-3 py-2 text-sm text-[#1B2A4A] outline-none focus:border-[#C8A96E]"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A4A] py-3 text-sm font-semibold text-white transition-opacity hover:bg-[#253759] disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}
