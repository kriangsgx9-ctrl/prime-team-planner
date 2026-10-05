"use client";

import { cn, inputClass } from "./primitives";

// Selects the field's whole value on focus so typing a new number starts
// fresh instead of fighting the existing "0" — and optionally renders a
// unit label (บาท, %, คน, ...) inside the field so the number's meaning is
// clear while typing, not just after.
export function NumberInput({ unit, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { unit?: string }) {
  return (
    <div className="relative">
      <input
        type="number"
        className={cn(inputClass, unit && "pr-12", className)}
        onFocus={(e) => e.currentTarget.select()}
        {...props}
      />
      {unit && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-[var(--muted)]">{unit}</span>}
    </div>
  );
}
