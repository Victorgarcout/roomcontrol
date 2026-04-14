"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home, BedDouble, CheckCircle2, ClipboardCheck, Wrench, ChevronLeft,
} from "lucide-react";
import Link from "next/link";

type QualityRole = "SUPER_ADMIN" | "ADMIN" | "OPE_HEBERGEMENT" | "OPE_TECHNIQUE";

const NAV_TABS = [
  { id: "hub", label: "Hub", icon: Home, href: "/quality/hub" },
  { id: "chambres", label: "Chambres", icon: BedDouble, href: "/quality/chambres" },
  { id: "actions", label: "Actions", icon: CheckCircle2, href: "/quality/actions" },
  { id: "rituals", label: "Rituels", icon: ClipboardCheck, href: "/quality/rituels" },
  { id: "tech", label: "Technique", icon: Wrench, href: "/quality/technique" },
];

const SUB_PAGES = [
  "/quality/performance", "/quality/playbook", "/quality/audit", "/quality/securite",
];

function getVisibleTabs(role?: QualityRole) {
  if (!role) return [];
  if (role === "SUPER_ADMIN" || role === "ADMIN") return NAV_TABS;
  if (role === "OPE_HEBERGEMENT") {
    return NAV_TABS.filter((t) =>
      ["hub", "chambres", "actions", "rituals"].includes(t.id)
    );
  }
  if (role === "OPE_TECHNIQUE") {
    return NAV_TABS.filter((t) => ["hub", "tech"].includes(t.id));
  }
  return [];
}

export default function QualityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as QualityRole | undefined;

  const visibleTabs = getVisibleTabs(role);
  const isSubPage = SUB_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-[#F5F3EE] font-outfit">
      {/* Top bar for sub-pages */}
      {isSubPage && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#EDE9E3]">
          <div className="max-w-[480px] mx-auto flex items-center gap-2 px-4 h-12">
            <button
              onClick={() => router.push("/quality/hub")}
              className="flex items-center gap-1 text-[#1B2A4A] text-sm font-semibold hover:text-[#C8A96E] transition-colors"
            >
              <ChevronLeft size={18} />
              Hub
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-[480px] mx-auto px-4 pt-4 pb-24">
        {children}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EDE9E3] safe-area-bottom">
        <div className="max-w-[480px] mx-auto flex justify-around items-center h-16">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href ||
              (tab.href !== "/quality/hub" && pathname.startsWith(tab.href));
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-[#1B2A4A]"
                    : "text-[#8E96A4] hover:text-[#5E6B80]"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
