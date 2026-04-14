"use client";

import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E96A4]">
      {children}
    </h3>
  );
}
