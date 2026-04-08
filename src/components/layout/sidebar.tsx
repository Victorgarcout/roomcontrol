"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  Calendar,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  Hotel,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHotelStore } from "@/stores/hotel-store";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Chambres",
    href: "/chambres",
    icon: BedDouble,
    badge: null as number | null,
  },
  {
    label: "Reservations",
    href: "/reservations",
    icon: CalendarCheck,
    badge: 3,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Planning",
    href: "/planning",
    icon: Calendar,
  },
  {
    label: "Qualite",
    href: "/qualite",
    icon: ClipboardCheck,
    badge: 2,
  },
  {
    label: "Rapports",
    href: "/rapports",
    icon: BarChart3,
  },
  {
    label: "Parametres",
    href: "/parametres",
    icon: Settings,
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { activeHotelId } = useHotelStore();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-[260px] bg-slate-900 text-white flex flex-col sidebar-transition",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Close */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Hotel className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              RoomControl
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hotel Selector */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors text-sm">
            <div className="flex items-center gap-2 truncate">
              <Hotel className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {activeHotelId ? "Hotel selectionne" : "Choisir un hotel"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-600/20 text-blue-400 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-blue-400" : "text-slate-400"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700/50 p-4">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold uppercase">
                {session.user.name
                  ? session.user.name.charAt(0)
                  : session.user.email?.charAt(0) ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.name ?? "Utilisateur"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {session.user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                title="Se deconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-700 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-slate-700 animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-slate-700 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
