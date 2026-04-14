"use client";

import React from "react";

interface QualityCardProps {
  children: React.ReactNode;
  accent?: string;
  onClick?: () => void;
  className?: string;
}

export default function QualityCard({ children, accent = "#C8A96E", onClick, className = "" }: QualityCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`w-full rounded-[14px] border border-[#E2DDD5] bg-white p-4 text-left ${
        onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      } ${className}`}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {children}
    </Component>
  );
}
