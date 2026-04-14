"use client";

import React from "react";

interface KPIProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  icon?: React.ElementType;
}

export default function KPI({ label, value, sub, color = "#1B2A4A", icon: Icon }: KPIProps) {
  return (
    <div className="rounded-[14px] border border-[#E2DDD5] bg-white p-4 text-center">
      {Icon && (
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}14` }}>
          <Icon size={20} style={{ color }} />
        </div>
      )}
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#5E6B80]">{sub}</div>}
      <div className="mt-1 text-xs font-medium text-[#8E96A4]">{label}</div>
    </div>
  );
}
