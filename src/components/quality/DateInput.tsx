"use client";

import React from "react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  late?: boolean;
}

export default function DateInput({ value, onChange, late = false }: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg bg-[#F5F3EE] px-3 py-1.5 text-sm text-[#1B2A4A] outline-none transition-colors ${
        late
          ? "border-2 border-red-400 focus:border-red-500"
          : "border border-[#E2DDD5] focus:border-[#C8A96E]"
      }`}
    />
  );
}
