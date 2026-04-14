"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { useAudit } from "@/hooks/quality/useAudit";
import { useHotelStore } from "@/stores/hotel-store";
import { AUDIT_ZONES, Q } from "@/lib/quality-theme";
import QualityCard from "@/components/quality/QualityCard";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";

const SCORE_COLORS: Record<number, string> = {
  1: Q.colors.err,
  2: Q.colors.warn,
  3: "#84CC16",
  4: Q.colors.ok,
};

const SCORE_BG: Record<number, string> = {
  1: Q.colors.errA,
  2: Q.colors.warnA,
  3: "rgba(132,204,22,0.08)",
  4: Q.colors.okA,
};

interface AuditDetail {
  id: string;
  date: string;
  score?: number;
  items?: { category: string; question: string; score: number; notes?: string }[];
  [key: string]: unknown;
}

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const { getAudit } = useAudit(hotelId);
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const id = typeof params.auditId === "string" ? params.auditId : "";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await getAudit(id);
      setAudit(result as AuditDetail | null);
    } finally {
      setLoading(false);
    }
  }, [id, getAudit]);

  useEffect(() => {
    load();
  }, [load]);

  const computeGlobalScore = (items?: { score: number }[]) => {
    if (!items || items.length === 0) return 0;
    const avg = items.reduce((s, i) => s + i.score, 0) / items.length;
    return Math.round((avg / 4) * 100);
  };

  const auditItems = audit?.items ?? [];
  const groupedItems = auditItems.reduce<Record<string, typeof auditItems>>(
    (acc, item) => {
      const cat = item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(item);
      return acc;
    },
    {}
  );

  if (loading) return <p className="py-8 text-center text-sm text-[#8E96A4]">Chargement...</p>;

  if (!audit) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/quality/audit")} className="flex items-center gap-1 text-sm text-[#5E6B80]">
          <ArrowLeft size={16} /> Retour
        </button>
        <EmptyState icon={ClipboardCheck} title="Audit introuvable" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <button onClick={() => router.push("/quality/audit")} className="flex items-center gap-1 text-sm text-[#5E6B80]">
        <ArrowLeft size={16} /> Retour
      </button>

      <div>
        <h1 className="text-lg font-bold text-[#1B2A4A]">
          Audit du {new Date(audit.date).toLocaleDateString("fr-FR")}
        </h1>
        <p className="text-xs text-[#8E96A4]">
          {audit.auditorName ? String(audit.auditorName) : "Auditeur"}
        </p>
        <p className="mt-1 text-2xl font-bold text-[#1B2A4A]">
          {computeGlobalScore(audit.items)}<span className="text-sm text-[#8E96A4]">/100</span>
        </p>
      </div>

      {AUDIT_ZONES.map((zone) => {
        const zoneItems = groupedItems[zone.id];
        if (!zoneItems || zoneItems.length === 0) return null;
        return (
          <div key={zone.id} className="space-y-2">
            <SectionLabel>{zone.name}</SectionLabel>
            {zoneItems.map((item, i) => (
              <QualityCard key={i}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1B2A4A]">{item.question}</p>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      color: SCORE_COLORS[item.score] ?? Q.colors.t2,
                      backgroundColor: SCORE_BG[item.score] ?? Q.colors.b2,
                    }}
                  >
                    {item.score}
                  </span>
                </div>
                {item.notes && (
                  <p className="mt-1 text-xs italic text-[#8E96A4]">{item.notes}</p>
                )}
              </QualityCard>
            ))}
          </div>
        );
      })}
    </div>
  );
}
