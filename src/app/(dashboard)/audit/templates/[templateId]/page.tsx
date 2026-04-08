"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck,
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  PlayCircle,
} from "lucide-react";

interface Checkpoint {
  id: string;
  label: string;
  subCategory: string | null;
  sortOrder: number;
  weight: number;
  isBlocking: boolean;
}

interface Zone {
  id: string;
  name: string;
  sortOrder: number;
  checkpoints: Checkpoint[];
}

interface TemplateData {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  scoringMode: string;
  isActive: boolean;
  createdAt: string;
  zones: Zone[];
  _count: { audits: number };
}

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scoringMode, setScoringMode] = useState("BINARY");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      const res = await fetch(`/api/audit/templates/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data);
        setName(data.name);
        setDescription(data.description || "");
        setScoringMode(data.scoringMode);
        setIsActive(data.isActive);
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [templateId]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/audit/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          scoringMode,
          isActive,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTemplate((prev) => (prev ? { ...prev, ...data } : prev));
        setSuccess("Template mis a jour");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Erreur lors de la mise a jour");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce template ? Cette action est irreversible.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/audit/templates/${templateId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/audit/templates/new");
      } else {
        setError("Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setDeleting(false);
    }
  };

  const totalCheckpoints = template
    ? template.zones.reduce((sum, z) => sum + z.checkpoints.length, 0)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
          Template introuvable
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {template.name}
          </h1>
          <p className="text-slate-500 mt-1">
            {totalCheckpoints} points &middot; {template.zones.length} zones &middot;{" "}
            {template._count.audits} audits realises
          </p>
        </div>
        <Link
          href="/audit/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Lancer un audit
        </Link>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Parametres
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mode de notation
              </label>
              <select
                value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base"
              >
                <option value="BINARY">Binaire (OK / NOK)</option>
                <option value="SCORE">Score (1-5)</option>
                <option value="COMMENT_ONLY">Commentaire uniquement</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-slate-300 bg-slate-50 dark:bg-slate-700 text-slate-500"
                }`}
              >
                {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isActive ? "Actif" : "Inactif"}
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Supprimer
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Zones & checkpoints (read-only view) */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Points de controle
        </h2>

        {template.zones.map((zone) => {
          const subCategories = [
            ...new Set(zone.checkpoints.map((cp) => cp.subCategory || "Autre")),
          ];

          return (
            <div key={zone.id} className="mb-6">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                {zone.name}
                <span className="text-xs text-slate-400 font-normal">
                  ({zone.checkpoints.length} points)
                </span>
              </h3>

              {subCategories.map((subCat) => {
                const cps = zone.checkpoints.filter(
                  (cp) => (cp.subCategory || "Autre") === subCat
                );

                return (
                  <div key={subCat} className="mb-3 ml-2">
                    <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                      {subCat}
                    </h4>
                    <div className="space-y-0.5">
                      {cps.map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span className="text-xs text-slate-400 w-5 text-right">
                            {cp.sortOrder + 1}
                          </span>
                          <span className="flex-1 text-slate-700 dark:text-slate-300">
                            {cp.label}
                          </span>
                          {cp.weight !== 1 && (
                            <span className="text-xs text-slate-400">
                              x{cp.weight}
                            </span>
                          )}
                          {cp.isBlocking && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 rounded">
                              BLOQUANT
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
