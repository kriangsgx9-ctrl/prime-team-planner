"use client";

import { useState } from "react";
import { EVAL_BOX_GRID, EVAL_BOX_META, nineBoxEmptyMessage, type NineBoxRow } from "@/lib/domain/evaluations";
import { ROLE_LABEL } from "@/lib/domain/org";

const TONE_CELL: Record<string, string> = {
  green: "bg-green-50 border-green-200",
  yellow: "bg-amber-50 border-amber-200",
  red: "bg-red-50 border-red-200",
};
const TONE_LABEL: Record<string, string> = {
  green: "text-green-700",
  yellow: "text-amber-700",
  red: "text-red-700",
};
const TONE_COUNT: Record<string, string> = {
  green: "text-green-800",
  yellow: "text-amber-800",
  red: "text-red-800",
};

export function EvalNineBox({ rows }: { rows: NineBoxRow[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const classified = rows.filter((r) => r.box);

  if (!classified.length) {
    return <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center text-sm text-[var(--muted)]">{nineBoxEmptyMessage(rows)}</div>;
  }

  const selectedPeople = selected ? classified.filter((r) => r.box === selected).sort((a, b) => (b.evalAvg ?? 0) - (a.evalAvg ?? 0)) : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex w-6 flex-col items-center justify-between py-2 text-[10px] font-bold text-[var(--muted)]">
          <span>สูง</span>
          <span className="[writing-mode:vertical-rl] rotate-180">คะแนนประเมิน</span>
          <span>ต่ำ</span>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {EVAL_BOX_GRID.flat().map((key) => {
              const meta = EVAL_BOX_META[key];
              const people = classified.filter((r) => r.box === key);
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : key)}
                  className={`min-h-[82px] rounded-xl border p-2.5 text-left transition ${TONE_CELL[meta.tone]} ${isSelected ? "ring-2 ring-[var(--navy)]" : ""} ${people.length ? "cursor-pointer hover:brightness-95" : "cursor-default opacity-70"}`}
                >
                  <div className={`text-[10px] font-extrabold ${TONE_LABEL[meta.tone]}`}>{meta.label}</div>
                  <div className={`mt-0.5 text-xl font-extrabold ${TONE_COUNT[meta.tone]}`}>{people.length}</div>
                  <div className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-[var(--muted)]">
                    {people.slice(0, 3).map((p) => p.name).join(", ") || "—"}
                    {people.length > 3 ? ` +${people.length - 3} คน` : ""}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between px-1 text-[10px] font-bold text-[var(--muted)]">
            <span>ผลงานต่ำ</span>
            <span>ผลงานปานกลาง</span>
            <span>ผลงานสูง</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-[var(--line)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-sm font-extrabold ${TONE_LABEL[EVAL_BOX_META[selected as keyof typeof EVAL_BOX_META].tone]}`}>
              {EVAL_BOX_META[selected as keyof typeof EVAL_BOX_META].label} ({selectedPeople.length} คน)
            </span>
            <button type="button" onClick={() => setSelected(null)} className="text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]">
              ✕ ปิด
            </button>
          </div>
          <div className="max-h-64 space-y-1.5 overflow-auto">
            {selectedPeople.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 border-b border-[var(--line)] py-1.5 text-sm last:border-0">
                <span className="font-semibold">
                  {p.name} <span className="font-medium text-[var(--muted)]">{ROLE_LABEL[p.role]}</span>
                </span>
                <span className="whitespace-nowrap text-xs font-bold text-[var(--muted)]">
                  ⭐ {p.evalAvg?.toFixed(1)} · {p.perfPct !== null ? `${Math.round(p.perfPct * 100)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
