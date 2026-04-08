"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHotelStore } from "@/stores/hotel-store";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Save,
  Download,
  GripVertical,
  AlertCircle,
} from "lucide-react";

interface CheckpointDraft {
  id: string;
  label: string;
  subCategory: string;
  weight: number;
  isBlocking: boolean;
}

interface ZoneDraft {
  id: string;
  name: string;
  checkpoints: CheckpointDraft[];
}

let draftId = 0;
const nextId = () => `draft_${++draftId}`;

export default function NewTemplatePage() {
  const router = useRouter();
  const { activeHotelId } = useHotelStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scoringMode, setScoringMode] = useState("BINARY");
  const [zones, setZones] = useState<ZoneDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState("");

  const addZone = () => {
    setZones([...zones, { id: nextId(), name: "", checkpoints: [] }]);
  };

  const removeZone = (zoneId: string) => {
    setZones(zones.filter((z) => z.id !== zoneId));
  };

  const updateZone = (zoneId: string, field: string, value: string) => {
    setZones(zones.map((z) => (z.id === zoneId ? { ...z, [field]: value } : z)));
  };

  const moveZone = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= zones.length) return;
    const newZones = [...zones];
    [newZones[index], newZones[newIndex]] = [newZones[newIndex], newZones[index]];
    setZones(newZones);
  };

  const addCheckpoint = (zoneId: string) => {
    setZones(
      zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              checkpoints: [
                ...z.checkpoints,
                { id: nextId(), label: "", subCategory: "", weight: 1, isBlocking: false },
              ],
            }
          : z
      )
    );
  };

  const removeCheckpoint = (zoneId: string, cpId: string) => {
    setZones(
      zones.map((z) =>
        z.id === zoneId
          ? { ...z, checkpoints: z.checkpoints.filter((cp) => cp.id !== cpId) }
          : z
      )
    );
  };

  const updateCheckpoint = (zoneId: string, cpId: string, field: string, value: any) => {
    setZones(
      zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              checkpoints: z.checkpoints.map((cp) =>
                cp.id === cpId ? { ...cp, [field]: value } : cp
              ),
            }
          : z
      )
    );
  };

  const moveCheckpoint = (zoneId: string, index: number, direction: -1 | 1) => {
    setZones(
      zones.map((z) => {
        if (z.id !== zoneId) return z;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= z.checkpoints.length) return z;
        const newCps = [...z.checkpoints];
        [newCps[index], newCps[newIndex]] = [newCps[newIndex], newCps[index]];
        return { ...z, checkpoints: newCps };
      })
    );
  };

  const loadDemoTemplate = async () => {
    if (!activeHotelId) return;
    setLoadingDemo(true);
    setError("");

    try {
      const res = await fetch("/api/audit/templates/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: activeHotelId }),
      });

      if (res.ok) {
        const template = await res.json();
        router.push(`/audit/templates/${template.id}`);
      } else {
        setError("Erreur lors du chargement du template demo");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleSave = async () => {
    if (!activeHotelId || !name.trim()) {
      setError("Nom du template requis");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        hotelId: activeHotelId,
        name: name.trim(),
        description: description.trim() || null,
        scoringMode,
        zones: zones
          .filter((z) => z.name.trim())
          .map((z) => ({
            name: z.name.trim(),
            checkpoints: z.checkpoints
              .filter((cp) => cp.label.trim())
              .map((cp) => ({
                label: cp.label.trim(),
                subCategory: cp.subCategory.trim() || null,
                weight: cp.weight,
                isBlocking: cp.isBlocking,
              })),
          })),
      };

      const res = await fetch("/api/audit/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const template = await res.json();
        router.push(`/audit/templates/${template.id}`);
      } else {
        setError("Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur reseau");
    } finally {
      setSaving(false);
    }
  };

  const totalCheckpoints = zones.reduce((sum, z) => sum + z.checkpoints.length, 0);

  if (!activeHotelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
          Selectionnez un hotel
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Nouveau Template
          </h1>
          <p className="text-slate-500 mt-1">
            Creez un template de controle qualite
          </p>
        </div>
        <button
          onClick={loadDemoTemplate}
          disabled={loadingDemo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-sm font-semibold transition-colors"
        >
          {loadingDemo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Charger template demo
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom du template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Controle Qualite Standard"
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
              placeholder="Description du template..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>

          <div>
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
        </div>
      </div>

      {/* Zones */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Zones ({zones.length})
          {totalCheckpoints > 0 && (
            <span className="text-sm font-normal text-slate-500 ml-2">
              {totalCheckpoints} points
            </span>
          )}
        </h2>
        <button
          onClick={addZone}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter zone
        </button>
      </div>

      <div className="space-y-4">
        {zones.map((zone, zi) => (
          <div
            key={zone.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveZone(zi, -1)}
                  disabled={zi === 0}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveZone(zi, 1)}
                  disabled={zi === zones.length - 1}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={zone.name}
                onChange={(e) => updateZone(zone.id, "name", e.target.value)}
                placeholder="Nom de la zone"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold"
              />
              <button
                onClick={() => removeZone(zone.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Checkpoints */}
            <div className="space-y-2 ml-6">
              {zone.checkpoints.map((cp, ci) => (
                <div
                  key={cp.id}
                  className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveCheckpoint(zone.id, ci, -1)}
                      disabled={ci === 0}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveCheckpoint(zone.id, ci, 1)}
                      disabled={ci === zone.checkpoints.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 w-5 text-right shrink-0">
                    {ci + 1}
                  </span>

                  <input
                    type="text"
                    value={cp.label}
                    onChange={(e) => updateCheckpoint(zone.id, cp.id, "label", e.target.value)}
                    placeholder="Point de controle"
                    className="flex-1 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  />

                  <input
                    type="text"
                    value={cp.subCategory}
                    onChange={(e) => updateCheckpoint(zone.id, cp.id, "subCategory", e.target.value)}
                    placeholder="Sous-categorie"
                    className="w-36 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />

                  <input
                    type="number"
                    value={cp.weight}
                    onChange={(e) => updateCheckpoint(zone.id, cp.id, "weight", parseFloat(e.target.value) || 1)}
                    className="w-14 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-center"
                    title="Poids"
                    min={0}
                    step={0.5}
                  />

                  <label className="flex items-center gap-1 cursor-pointer shrink-0" title="Bloquant">
                    <input
                      type="checkbox"
                      checked={cp.isBlocking}
                      onChange={(e) => updateCheckpoint(zone.id, cp.id, "isBlocking", e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-xs text-red-500 font-medium">B</span>
                  </label>

                  <button
                    onClick={() => removeCheckpoint(zone.id, cp.id)}
                    className="p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addCheckpoint(zone.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter point
              </button>
            </div>
          </div>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <GripVertical className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucune zone. Ajoutez une zone pour commencer.</p>
        </div>
      )}

      {/* Save button */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer le template
        </button>
      </div>
    </div>
  );
}
