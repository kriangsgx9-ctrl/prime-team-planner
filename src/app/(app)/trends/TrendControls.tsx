"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/primitives";

export function TrendControls({
  members,
  roleLabel,
  memberId,
  granularity,
  scope,
  metric,
}: {
  members: Array<{ id: string; name: string; role: string }>;
  roleLabel: Record<string, string>;
  memberId: string;
  granularity: string;
  scope: string;
  metric: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  return (
    <form ref={formRef} method="get" action="/trends" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="granularity" defaultValue={granularity} className={inputClass} onChange={submit}>
          <option value="month">รายเดือน (12 เดือนล่าสุด)</option>
          <option value="year">รายปี (4 ปีล่าสุด)</option>
        </select>
        <select name="scope" defaultValue={scope} className={inputClass} onChange={submit}>
          <option value="person">รายบุคคล (เลือกด้านล่าง)</option>
          <option value="team">ทั้งบริษัท</option>
        </select>
      </div>
      {scope === "person" && (
        <select name="memberId" defaultValue={memberId} className={inputClass} onChange={submit}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({roleLabel[m.role]})
            </option>
          ))}
        </select>
      )}
      <select name="metric" defaultValue={metric} className={inputClass} onChange={submit}>
        <option value="actualFYP">FYP</option>
        <option value="actualNBC">NBC</option>
        <option value="actualFYC">FYC</option>
      </select>
    </form>
  );
}
