"use client";

import React from "react";

interface TagProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
}

export default function Tag({ children, color = "#1B2A4A", bg = "#EDE9E3" }: TagProps) {
  return (
    <span
      className="inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold leading-tight"
      style={{ color, backgroundColor: bg }}
    >
      {children}
    </span>
  );
}
