"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ClipboardCheck,
  User,
} from "lucide-react";

interface AuditResult {
  id: string;
  checkpointId: string;
  passed: boolean | null;
  score: number | null;
  comment: string | null;
  checkpoint: {
    id: string;
    label: string;
    subCategory: string | null;
    weight: number;
    isBlocking: boolean;
    zone: { id: string; name: string };
  };
}

interface ZoneScore {
  name: string;
  passed: number;
  total: number;
  score: number;
}

interface AuditData {
  id: string;
  score: number | null;
  maxScore: number | null;
  passed: boolean;
  duration: number | null;
  notes: string | null;
  signature: string | null;
  startedAt: string;
  completedAt: string | null;
  room: { id: string; number: string; floor: number };
  template: {
    id: string;
    name: string;
    zones: { id: string; name: string; checkpoints: any[] }[];
  };
  auditor: { id: string; name: string | null; email: string };
  results: AuditResult[];
  zoneScores: Record<string, ZoneScore>;
  previousAudit: {
    id: string;
    score: number | null;
    passed: boolean;
    startedAt: string;
  } | null;
}

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.auditId as string;

  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      const res = await fetch(`/api/audit/${auditId}`);
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
      }
      setLoading(false);
    };

    fetchAudit();
  }, [auditId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s.toString().padStart(2, "0")}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
          Audit introuvable
        </h2>
        <Link href="/audit/new" className="mt-4 text-blue-600 hover:underline">
          Retour aux audits
        </Link>
      </div>
    );
  }

  const nonConformities = audit.results.filter((r) => r.passed === false);
  const scoreDiff = audit.previousAudit?.score != null && audit.score != null
    ? Math.round((audit.score - audit.previousAudit.score) * 100) / 100
    : null;

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Header card */}
      <div
        className={`rounded-2xl p-6 mb-6 ${
          audit.passed
            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Chambre #{audit.room.number}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {audit.template.name} &middot; Etage {audit.room.floor}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${
              audit.passed
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {audit.passed ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            {audit.passed ? "CONFORME" : "NON CONFORME"}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white">
              {audit.score != null ? `${audit.score}%` : "-"}
            </p>
            <p className="text-sm text-slate-500">Score global</p>
          </div>

          {scoreDiff !== null && (
            <div className="flex items-center gap-1">
              {scoreDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : scoreDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <Minus className="w-5 h-5 text-slate-400" />
              )}
              <span
                className={`text-sm font-semibold ${
                  scoreDiff > 0 ? "text-green-600" : scoreDiff < 0 ? "text-red-600" : "text-slate-400"
                }`}
              >
                {scoreDiff > 0 ? "+" : ""}
                {scoreDiff}% vs precedent
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            {audit.duration ? formatTime(audit.duration) : "-"}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {audit.auditor.name || audit.auditor.email}
          </div>
          <div>{formatDate(audit.startedAt)}</div>
          <div>
            {audit.results.filter((r) => r.passed !== null).length}/{audit.results.length} points
          </div>
        </div>
      </div>

      {/* Zone scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {Object.entries(audit.zoneScores).map(([zoneId, zs]) => (
          <div
            key={zoneId}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {zs.name}
            </h3>
            <div className="flex items-end gap-2">
              <span
                className={`text-2xl font-bold ${
                  zs.score >= 80 ? "text-green-600" : zs.score >= 60 ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {zs.score}%
              </span>
              <span className="text-sm text-slate-400 mb-0.5">
                {zs.passed}/{zs.total} OK
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  zs.score >= 80 ? "bg-green-500" : zs.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${zs.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Previous audit comparison */}
      {audit.previousAudit && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Comparaison avec l&apos;audit precedent
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {formatDate(audit.previousAudit.startedAt)}
              </p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {audit.previousAudit.score}%{" "}
                <span
                  className={`text-sm ${
                    audit.previousAudit.passed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ({audit.previousAudit.passed ? "Conforme" : "Non conforme"})
                </span>
              </p>
            </div>
            <Link
              href={`/audit/${audit.previousAudit.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Voir
            </Link>
          </div>
        </div>
      )}

      {/* Non-conformities */}
      {nonConformities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Non-conformites ({nonConformities.length})
          </h2>
          <div className="space-y-2">
            {nonConformities.map((r) => (
              <div
                key={r.id}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {r.checkpoint.label}
                      {r.checkpoint.isBlocking && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">
                          BLOQUANT
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.checkpoint.zone.name}
                      {r.checkpoint.subCategory && ` > ${r.checkpoint.subCategory}`}
                    </p>
                    {r.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full results list */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Detail complet
        </h2>
        {audit.template.zones.map((zone) => {
          const zoneResults = audit.results.filter(
            (r) => r.checkpoint.zone.id === zone.id
          );

          return (
            <div key={zone.id} className="mb-4">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                {zone.name}
              </h3>
              <div className="space-y-1">
                {zoneResults.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      r.passed === true
                        ? "bg-green-50 dark:bg-green-900/10"
                        : r.passed === false
                        ? "bg-red-50 dark:bg-red-900/10"
                        : "bg-slate-50 dark:bg-slate-800/50"
                    }`}
                  >
                    {r.passed === true ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : r.passed === false ? (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="flex-1 text-slate-700 dark:text-slate-300">
                      {r.checkpoint.label}
                    </span>
                    {r.comment && (
                      <span className="text-xs text-slate-400 truncate max-w-[150px]">
                        {r.comment}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {audit.notes && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {audit.notes}
          </p>
        </div>
      )}
    </div>
  );
}
