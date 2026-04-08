"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHotelStore } from "@/stores/hotel-store";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";

interface Room {
  id: string;
  number: string;
  floor: number;
}

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

interface Template {
  id: string;
  name: string;
  scoringMode: string;
  zones: Zone[];
}

interface CheckpointState {
  passed: boolean | null;
  comment: string;
  showComment: boolean;
}

export default function NewAuditPage() {
  const router = useRouter();
  const { activeHotelId } = useHotelStore();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [results, setResults] = useState<Record<string, CheckpointState>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch rooms and templates
  useEffect(() => {
    if (!activeHotelId) return;

    const fetchData = async () => {
      setLoading(true);
      const [roomsRes, templatesRes] = await Promise.all([
        fetch(`/api/rooms?hotelId=${activeHotelId}`),
        fetch(`/api/audit/templates?hotelId=${activeHotelId}`),
      ]);
      const roomsData = await roomsRes.json();
      const templatesData = await templatesRes.json();
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setLoading(false);
    };

    fetchData();
  }, [activeHotelId]);

  // Load template details when selected
  useEffect(() => {
    if (!selectedTemplateId) {
      setActiveTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      const res = await fetch(`/api/audit/templates/${selectedTemplateId}`);
      const data = await res.json();
      setActiveTemplate(data);

      // Initialize results
      const init: Record<string, CheckpointState> = {};
      for (const zone of data.zones || []) {
        for (const cp of zone.checkpoints || []) {
          init[cp.id] = { passed: null, comment: "", showComment: false };
        }
      }
      setResults(init);

      // Start timer
      setElapsed(0);
      setTimerActive(true);
    };

    fetchTemplate();
  }, [selectedTemplateId]);

  // Timer interval
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const setCheckpointResult = useCallback((cpId: string, passed: boolean) => {
    setResults((prev) => ({
      ...prev,
      [cpId]: { ...prev[cpId], passed: prev[cpId]?.passed === passed ? null : passed },
    }));
  }, []);

  const toggleComment = useCallback((cpId: string) => {
    setResults((prev) => ({
      ...prev,
      [cpId]: { ...prev[cpId], showComment: !prev[cpId]?.showComment },
    }));
  }, []);

  const setComment = useCallback((cpId: string, comment: string) => {
    setResults((prev) => ({
      ...prev,
      [cpId]: { ...prev[cpId], comment },
    }));
  }, []);

  // Compute progress and score
  const totalCheckpoints = activeTemplate
    ? activeTemplate.zones.reduce((sum, z) => sum + z.checkpoints.length, 0)
    : 0;
  const checkedCount = Object.values(results).filter((r) => r.passed !== null).length;
  const passedCount = Object.values(results).filter((r) => r.passed === true).length;
  const failedCount = Object.values(results).filter((r) => r.passed === false).length;
  const scorePercent = checkedCount > 0 ? Math.round((passedCount / checkedCount) * 100) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!selectedRoomId || !selectedTemplateId || checkedCount === 0) return;

    setSubmitting(true);
    setTimerActive(false);

    const resultsList = Object.entries(results)
      .filter(([, r]) => r.passed !== null)
      .map(([checkpointId, r]) => ({
        checkpointId,
        passed: r.passed,
        comment: r.comment || null,
      }));

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          roomId: selectedRoomId,
          results: resultsList,
          duration: elapsed,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const audit = await res.json();
        router.push(`/audit/${audit.id}`);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission", error);
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nouvel Audit Qualite
        </h1>
        <p className="text-slate-500 mt-1">Mode rapide - verification chambre</p>
      </div>

      {/* Room & Template selection */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Chambre
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base"
          >
            <option value="">-- Choisir une chambre --</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Chambre #{room.number} (Etage {room.floor})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Template d&apos;audit
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-base"
          >
            <option value="">-- Choisir un template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress bar + Timer */}
      {activeTemplate && (
        <>
          <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-3 px-4 -mx-4 mb-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {checkedCount}/{totalCheckpoints} points verifies
                </span>
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {passedCount}
                </span>
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <XCircle className="w-3.5 h-3.5" /> {failedCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {formatTime(elapsed)}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${totalCheckpoints > 0 ? (checkedCount / totalCheckpoints) * 100 : 0}%` }}
              />
            </div>
            {checkedCount > 0 && (
              <div className="mt-1 text-right">
                <span
                  className={`text-sm font-bold ${
                    scorePercent >= 80 ? "text-green-600" : scorePercent >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  Score: {scorePercent}%
                </span>
              </div>
            )}
          </div>

          {/* Checkpoints by zone */}
          <div className="space-y-6">
            {activeTemplate.zones.map((zone) => {
              const subCategories = [
                ...new Set(zone.checkpoints.map((cp) => cp.subCategory || "Autre")),
              ];

              return (
                <div key={zone.id}>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 px-1">
                    {zone.name}
                  </h2>

                  {subCategories.map((subCat) => {
                    const checkpoints = zone.checkpoints.filter(
                      (cp) => (cp.subCategory || "Autre") === subCat
                    );

                    return (
                      <div key={subCat} className="mb-4">
                        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 px-1 uppercase tracking-wide">
                          {subCat}
                        </h3>
                        <div className="space-y-1">
                          {checkpoints.map((cp, idx) => {
                            const state = results[cp.id];
                            const globalIndex =
                              activeTemplate.zones
                                .slice(0, activeTemplate.zones.indexOf(zone))
                                .reduce((sum, z) => sum + z.checkpoints.length, 0) +
                              zone.checkpoints.indexOf(cp) +
                              1;

                            return (
                              <div
                                key={cp.id}
                                className={`rounded-xl border transition-colors ${
                                  state?.passed === true
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : state?.passed === false
                                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 p-3">
                                  <span className="text-xs font-mono text-slate-400 w-6 text-right shrink-0">
                                    {globalIndex}.
                                  </span>
                                  <span className="flex-1 text-sm text-slate-800 dark:text-slate-200 leading-tight">
                                    {cp.label}
                                    {cp.isBlocking && (
                                      <span className="ml-1 text-xs text-red-500 font-semibold">*</span>
                                    )}
                                  </span>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => toggleComment(cp.id)}
                                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setCheckpointResult(cp.id, true)}
                                      className={`p-2.5 rounded-xl font-semibold text-sm min-w-[52px] transition-all ${
                                        state?.passed === true
                                          ? "bg-green-600 text-white shadow-md"
                                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-green-100 dark:hover:bg-green-900/30"
                                      }`}
                                    >
                                      OK
                                    </button>
                                    <button
                                      onClick={() => setCheckpointResult(cp.id, false)}
                                      className={`p-2.5 rounded-xl font-semibold text-sm min-w-[52px] transition-all ${
                                        state?.passed === false
                                          ? "bg-red-600 text-white shadow-md"
                                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                                      }`}
                                    >
                                      NOK
                                    </button>
                                  </div>
                                </div>

                                {state?.showComment && (
                                  <div className="px-3 pb-3">
                                    <input
                                      type="text"
                                      placeholder="Ajouter un commentaire..."
                                      value={state.comment}
                                      onChange={(e) => setComment(cp.id, e.target.value)}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes generales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques sur l'audit..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Sticky submit */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-30 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {checkedCount}/{totalCheckpoints} &middot;{" "}
                <span
                  className={`font-bold ${
                    scorePercent >= 80 ? "text-green-600" : scorePercent >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}
                >
                  {scorePercent}%
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedRoomId || checkedCount === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Valider l&apos;audit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
