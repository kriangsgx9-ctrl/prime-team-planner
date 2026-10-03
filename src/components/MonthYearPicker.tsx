"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/primitives";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function MonthYearPicker({ action, year, month, extraFields }: { action: string; year: number; month: number; extraFields?: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} method="get" action={action} className="grid gap-3 sm:grid-cols-3">
      {extraFields}
      <select name="month" defaultValue={month} className={inputClass} onChange={() => formRef.current?.requestSubmit()}>
        {MONTHS_TH.map((label, i) => (
          <option key={i} value={i + 1}>
            {label}
          </option>
        ))}
      </select>
      <select name="year" defaultValue={year} className={inputClass} onChange={() => formRef.current?.requestSubmit()}>
        {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
          <option key={y} value={y}>
            {y + 543}
          </option>
        ))}
      </select>
    </form>
  );
}
