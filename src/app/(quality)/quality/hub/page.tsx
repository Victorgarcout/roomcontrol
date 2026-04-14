"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useHotelStore } from "@/stores/hotel-store";
import { useQualityHub } from "@/hooks/quality/useQualityHub";
import { Q } from "@/lib/quality-theme";
import KPI from "@/components/quality/KPI";
import AlertBanner from "@/components/quality/AlertBanner";
import SectionLabel from "@/components/quality/SectionLabel";
import QualityCard from "@/components/quality/QualityCard";
import EmptyState from "@/components/quality/EmptyState";
import {
  CheckCircle,
  ClipboardList,
  TrendingUp,
  BarChart3,
  BookOpen,
  Search,
  ShieldCheck,
  Hotel,
} from "lucide-react";

const QUICK_ACCESS = [
  { href: "/quality/performance", icon: BarChart3, title: "Performance", sub: "TrustYou & KPIs", roles: ["SUPER_ADMIN", "ADMIN", "OPE_HEBERGEMENT"] },
  { href: "/quality/playbook", icon: BookOpen, title: "Playbook", sub: "Animations & boosts", roles: ["SUPER_ADMIN", "ADMIN", "OPE_HEBERGEMENT"] },
  { href: "/quality/audit", icon: Search, title: "Audit", sub: "Audit qualite", roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/quality/securite", icon: ShieldCheck, title: "Securite", sub: "Registre ERP", roles: ["SUPER_ADMIN", "ADMIN"] },
];

function RpsGauge({ value }: { value: number }) {
  const r = 40, c = 2 * Math.PI * r;
  const pct = Math.min(value / 100, 1);
  return (
    <svg width={100} height={100} className="mx-auto">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8} />
      <circle
        cx={50} cy={50} r={r} fill="none" stroke={Q.colors.sand}
        strokeWidth={8} strokeLinecap="round" strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 50 50)"
      />
      <text x={50} y={46} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={700}>{value}</text>
      <text x={50} y={62} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>RPS</text>
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-36 rounded-2xl bg-[#E2DDD5]" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-[#E2DDD5]" />)}
      </div>
      <div className="h-6 w-32 rounded bg-[#E2DDD5]" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-xl bg-[#E2DDD5]" />)}
      </div>
    </div>
  );
}

export default function HubPage() {
  const router = useRouter();
  const activeHotelId = useHotelStore((s) => s.activeHotelId);
  const { data, loading } = useQualityHub(activeHotelId ?? "");
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined;

  if (!activeHotelId) {
    return (
      <div className="font-outfit min-h-screen bg-[#F5F3EE] p-6">
        <EmptyState icon={Hotel} title="Aucun hotel selectionne" sub="Choisissez un hotel pour commencer." />
      </div>
    );
  }

  if (loading) return <div className="font-outfit min-h-screen bg-[#F5F3EE]"><Skeleton /></div>;

  const hotel = (data?.hotel ?? {}) as Record<string, unknown>;
  const perf = (data?.performance ?? {}) as Record<string, unknown>;
  const actions = (data?.actions ?? {}) as Record<string, unknown>;
  const rituals = (data?.rituals ?? {}) as Record<string, unknown>;
  const tickets = (data?.tickets ?? {}) as Record<string, unknown>;

  const rps = Number(perf.rps ?? 0);
  const actionsDone = Number(actions.done ?? 0);
  const actionsTotal = Number(actions.total ?? 0);
  const ritualsDone = Number(rituals.done ?? 0);
  const ritualsTotal = Number(rituals.total ?? 0);
  const alertCount = Number(tickets.alertCount ?? tickets.open ?? 0);

  const visibleCards = QUICK_ACCESS.filter((c) =>
    !role || c.roles.includes(role)
  );

  return (
    <div className="font-outfit min-h-screen bg-[#F5F3EE]">
      {/* Hero */}
      <div
        className="rounded-b-3xl px-6 pb-8 pt-10 text-white"
        style={{ background: `linear-gradient(135deg, ${Q.colors.navy} 0%, ${Q.colors.navy2} 100%)` }}
      >
        <h1 className="text-lg font-bold">{String(hotel.name ?? "Hotel")}</h1>
        <p className="text-xs text-white/60">
          {String(hotel.city ?? "")} {hotel.roomCount ? `- ${hotel.roomCount} chambres` : ""}
        </p>
        <RpsGauge value={rps} />
      </div>

      <div className="space-y-5 px-5 pb-24 pt-5">
        {/* Alert */}
        {alertCount > 0 && (
          <AlertBanner count={alertCount} onClick={() => router.push("/quality/technique")} />
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <KPI icon={CheckCircle} label="Actions" value={`${actionsDone}/${actionsTotal}`} color={Q.colors.ok} />
          <KPI icon={ClipboardList} label="Rituels" value={`${ritualsDone}/${ritualsTotal}`} color={Q.colors.info} />
          <KPI icon={TrendingUp} label="RPS" value={rps} color={Q.colors.sand} />
        </div>

        {/* Quick access */}
        {visibleCards.length > 0 && (
          <>
            <SectionLabel>Acces rapide</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {visibleCards.map((card) => (
                <QualityCard key={card.href} accent={Q.colors.sand} onClick={() => router.push(card.href)}>
                  <card.icon size={20} className="mb-2 text-[#C8A96E]" />
                  <p className="text-sm font-semibold text-[#1B2A4A]">{card.title}</p>
                  <p className="text-[11px] text-[#8E96A4]">{card.sub}</p>
                </QualityCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
