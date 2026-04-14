"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  count: number;
  label?: string;
  onClick?: () => void;
}

export default function AlertBanner({ count, label, onClick }: AlertBannerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[14px] border border-red-200 bg-[rgba(220,38,38,0.08)] px-4 py-3 text-left transition-colors hover:bg-[rgba(220,38,38,0.14)]"
    >
      <AlertTriangle size={18} className="shrink-0 text-red-600" />
      <span className="text-sm font-semibold text-red-700">
        {count} {label ?? `alerte${count > 1 ? "s" : ""}`}
      </span>
    </button>
  );
}
