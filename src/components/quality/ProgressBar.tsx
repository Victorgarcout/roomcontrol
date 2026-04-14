"use client";

import React from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ value, max = 100, color = "#C8A96E", height = 6 }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full overflow-hidden rounded-full bg-[#E8E4DD]" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
