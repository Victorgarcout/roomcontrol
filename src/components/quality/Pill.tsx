"use client";

import React from "react";

interface PillProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: string;
  count?: number;
}

export default function Pill({ children, active, onClick, color = "#1B2A4A", count }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active ? color : "transparent",
        color: active ? "#FFFFFF" : color,
        border: `1.5px solid ${active ? color : "#D1D5DB"}`,
      }}
    >
      {children}
      {count !== undefined && (
        <span
          className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{
            backgroundColor: active ? "rgba(255,255,255,0.25)" : `${color}14`,
            color: active ? "#FFFFFF" : color,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
