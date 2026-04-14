"use client";

import React from "react";

interface NoteButtonProps {
  active: boolean;
  color: string;
  children: React.ReactNode;
  onClick: () => void;
}

export default function NoteButton({ active, color, children, onClick }: NoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors"
      style={{
        width: 32,
        height: 28,
        borderRadius: 8,
        backgroundColor: active ? `${color}1A` : "transparent",
        border: `1.5px solid ${active ? color : "#D1D5DB"}`,
        color: active ? color : "#9CA3AF",
      }}
    >
      {children}
    </button>
  );
}
