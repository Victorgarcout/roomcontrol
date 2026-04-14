"use client";

import { useState, useEffect } from "react";
import { BedDouble, Save, Clock } from "lucide-react";
import { useHotelStore } from "@/stores/hotel-store";
import NoteButton from "@/components/quality/NoteButton";
import SectionLabel from "@/components/quality/SectionLabel";
import EmptyState from "@/components/quality/EmptyState";
import QualityCard from "@/components/quality/QualityCard";
import Pill from "@/components/quality/Pill";
import { Q, ROOM_EQUIPMENT } from "@/lib/quality-theme";

type EquipState = "BON" | "DEGRADE" | "HS";
const STATES: { value: EquipState; label: string; color: string }[] = [
  { value: "BON", label: "OK", color: Q.colors.ok },
  { value: "DEGRADE", label: "Dég", color: Q.colors.warn },
  { value: "HS", label: "HS", color: Q.colors.err },
];

export default function ChambresPage() {
  const hotelId = useHotelStore((s) => s.activeHotelId) ?? "";
  const [mode, setMode] = useState<"rapide" | "avance">("rapide");
  const [roomNumber, setRoomNumber] = useState("");
  const [equipStates, setEquipStates] = useState<Record<string, EquipState>>({});
  const [action, setAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch recent checks
  useEffect(() => {
    if (!hotelId) return;
    setLoadingRecent(true);
    fetch(`/api/quality/maintenance/room-equip?hotelId=${hotelId}&limit=10`)
      .then((r) => r.json())
      .then((j) => setRecent(j.data ?? []))
      .finally(() => setLoadingRecent(false));
  }, [hotelId]);

  const toggleState = (equip: string, state: EquipState) => {
    setEquipStates((prev) => ({ ...prev, [equip]: prev[equip] === state ? undefined! : state }));
  };

  const handleSave = async () => {
    if (!roomNumber || !hotelId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quality/maintenance/room-equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          roomNumber,
          checkDate: new Date().toISOString(),
          equipStates,
          action: action || undefined,
        }),
      });
      if (res.ok) {
        // Reset & refresh
        setRoomNumber("");
        setEquipStates({});
        setAction("");
        const j = await fetch(`/api/quality/maintenance/room-equip?hotelId=${hotelId}&limit=10`).then((r) => r.json());
        setRecent(j.data ?? []);
      }
    } finally {
      setSaving(false);
    }
  };

  const filledCount = Object.keys(equipStates).filter((k) => equipStates[k]).length;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#1B2A4A]">Contrôle Chambres</h1>

      {/* Mode pills */}
      <div className="flex gap-2">
        <Pill active={mode === "rapide"} onClick={() => setMode("rapide")}>Rapide</Pill>
        <Pill active={mode === "avance"} onClick={() => setMode("avance")}>Avancé</Pill>
      </div>

      {mode === "avance" ? (
        <EmptyState icon={Clock} title="Mode avancé" sub="Bientôt disponible" />
      ) : (
        <div className="space-y-4">
          {/* Room number */}
          <div>
            <SectionLabel>Numéro de chambre</SectionLabel>
            <input
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="Ex: 201"
              className="mt-1 w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-sm"
            />
          </div>

          {/* Equipment grid */}
          <div>
            <SectionLabel>Équipements ({filledCount}/{ROOM_EQUIPMENT.length})</SectionLabel>
            <div className="mt-2 space-y-2">
              {ROOM_EQUIPMENT.map((equip) => (
                <div key={equip} className="flex items-center justify-between rounded-xl border border-[#E2DDD5] bg-white px-3 py-2">
                  <span className="text-xs font-medium text-[#1B2A4A]">{equip}</span>
                  <div className="flex gap-1.5">
                    {STATES.map((s) => (
                      <NoteButton
                        key={s.value}
                        active={equipStates[equip] === s.value}
                        color={s.color}
                        onClick={() => toggleState(equip, s.value)}
                      >
                        {s.label}
                      </NoteButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action */}
          <div>
            <SectionLabel>Action / Remarque</SectionLabel>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Action corrective si nécessaire..."
              className="mt-1 w-full rounded-lg border border-[#E2DDD5] bg-[#F5F3EE] px-3 py-2 text-xs"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!roomNumber || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2A4A] py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer le contrôle"}
          </button>

          {/* Recent checks */}
          <div className="space-y-2 pt-2">
            <SectionLabel>Contrôles récents</SectionLabel>
            {loadingRecent ? (
              <p className="text-center text-xs text-[#8E96A4] py-4">Chargement...</p>
            ) : recent.length === 0 ? (
              <EmptyState icon={BedDouble} title="Aucun contrôle" sub="Effectuez votre premier contrôle" />
            ) : (
              recent.map((item) => {
                const states = (item.equipStates ?? {}) as Record<string, string>;
                return (
                  <QualityCard key={item.id as string}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-[#1B2A4A]">Ch. {item.roomNumber as string}</span>
                        <span className="ml-2 text-[11px] text-[#8E96A4]">
                          {new Date(item.checkDate as string).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {Object.values(states).map((s, i) => (
                          <span
                            key={i}
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: s === "BON" ? Q.colors.ok : s === "DEGRADE" ? Q.colors.warn : Q.colors.err,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </QualityCard>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
