"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/primitives";

export interface PickerMember {
  id: string;
  name: string;
  role: string;
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function PeriodPicker({
  members,
  roleLabel,
  memberId,
  year,
  month,
  action,
}: {
  members: PickerMember[];
  roleLabel: Record<string, string>;
  memberId: string;
  year: number;
  month: number;
  action: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} method="get" action={action} className="grid gap-3 sm:grid-cols-3">
      <select name="memberId" defaultValue={memberId} className={inputClass} onChange={() => formRef.current?.requestSubmit()}>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({roleLabel[m.role]})
          </option>
        ))}
      </select>
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
