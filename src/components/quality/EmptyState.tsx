"use client";

import React from "react";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  sub?: string;
}

export default function EmptyState({ icon: Icon, title, sub }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(200,169,110,0.10)]">
        <Icon size={24} className="text-[#C8A96E]" />
      </div>
      <p className="text-sm font-semibold text-[#1B2A4A]">{title}</p>
      {sub && <p className="mt-1 text-xs text-[#8E96A4]">{sub}</p>}
    </div>
  );
}
