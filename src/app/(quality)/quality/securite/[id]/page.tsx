"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, CheckCircle2, Circle } from "lucide-react";
import { useSafety } from "@/hooks/quality/useSafety";
import { useHotelStore } from "@/stores/hotel-store";
import { Q } from "@/lib/quality-theme";
import QualityCard from "@/components/quality/QualityCard";
import Tag from "@/components/quality/Tag";
import EmptyState from "@/components/quality/EmptyState";

const RESULT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  favorable: { color: Q.colors.ok, bg: Q.colors.okA, label: "Favorable" },
  defavorable: { color: Q.colors.err, bg: Q.colors.errA, label: "D\u00e9favorable" },
  favorable_avec_reserves: { color: Q.colors.warn, bg: Q.colors.warnA, label: "Favorable avec r\u00e9serves" },
};

interface Prescription {
  text: string;
  resolved: boolean;
  resolvedDate?: string;
}

interface CommissionDetail {
  id: string;
  date: string;
  result?: string;
  prescriptions?: Prescription[];
  nextVisitDate?: string;
  [key: string]: unknown;
}

export default function CommissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const { updateCommission } = useSafety(hotelId);
  const [commission, setCommission] = useState<CommissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const id = typeof params.id === "string" ? params.id : "";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quality/safety/commissions/${id}`);
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setCommission(json.data ?? json);
    } catch {
      setCommission(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleResolved = async (index: number) => {
    if (!commission?.prescriptions) return;
    const updated = commission.prescriptions.map((p, i) =>
      i === index
        ? { ...p, resolved: !p.resolved, resolvedDate: !p.resolved ? new Date().toISOString().slice(0, 10) : undefined }
        : p
    );
    setCommission({ ...commission, prescriptions: updated });
    await updateCommission(id, { prescriptions: updated } as Record<string, unknown>);
  };

  if (loading) return <p className="py-8 text-center text-sm text-[#8E96A4]">Chargement...</p>;

  if (!commission) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/quality/securite")} className="flex items-center gap-1 text-sm text-[#5E6B80]">
          <ArrowLeft size={16} /> Retour
        </button>
        <EmptyState icon={Shield} title="Commission introuvable" />
      </div>
    );
  }

  const result = commission.result as string;
  const rs = RESULT_STYLES[result] ?? RESULT_STYLES.favorable;
  const prescriptions = commission.prescriptions ?? [];

  return (
    <div className="space-y-4 pb-8">
      <button onClick={() => router.push("/quality/securite")} className="flex items-center gap-1 text-sm text-[#5E6B80]">
        <ArrowLeft size={16} /> Retour
      </button>

      <div>
        <h1 className="text-lg font-bold text-[#1B2A4A]">
          Commission du {new Date(commission.date).toLocaleDateString("fr-FR")}
        </h1>
        <div className="mt-1">
          <Tag color={rs.color} bg={rs.bg}>{rs.label}</Tag>
        </div>
        {commission.nextVisitDate && (
          <p className="mt-2 text-xs text-[#8E96A4]">
            Prochaine visite : {new Date(commission.nextVisitDate).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#1B2A4A]">
          Prescriptions ({prescriptions.filter((p) => p.resolved).length}/{prescriptions.length})
        </p>
        {prescriptions.length === 0 && (
          <EmptyState icon={Shield} title="Aucune prescription" />
        )}
        {prescriptions.map((p, i) => (
          <QualityCard key={i} accent={p.resolved ? Q.colors.ok : Q.colors.warn}>
            <button
              onClick={() => toggleResolved(i)}
              className="flex w-full items-start gap-3 text-left"
            >
              {p.resolved ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
              ) : (
                <Circle size={18} className="mt-0.5 shrink-0 text-[#8E96A4]" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${p.resolved ? "text-[#8E96A4] line-through" : "text-[#1B2A4A]"}`}>
                  {p.text}
                </p>
                {p.resolved && p.resolvedDate && (
                  <p className="text-[11px] text-[#8E96A4]">
                    R\u00e9solu le {new Date(p.resolvedDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </button>
          </QualityCard>
        ))}
      </div>
    </div>
  );
}
