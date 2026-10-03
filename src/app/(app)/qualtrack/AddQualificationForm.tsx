"use client";

import { useActionState, useState } from "react";
import { addQualificationAction } from "@/app/actions/qualifications";
import { QUAL_METRIC_LABEL, QUAL_METRIC_PERIOD, QUAL_SCOPE_LABEL, type QualMetric } from "@/lib/domain/qualifications";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

const TWO_MONTH_METRICS = new Set<QualMetric>(["fyp2mo", "fyc2mo", "nbc2mo"]);

export function AddQualificationForm() {
  const [state, action, pending] = useActionState(addQualificationAction, undefined);
  const [metric, setMetric] = useState<QualMetric>("actualNBC");
  const isPct = metric.includes("Pct") || metric === "persistency";

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ไอคอน (emoji)">
          <input name="icon" defaultValue="🏅" maxLength={4} className={inputClass} />
        </Field>
        <Field label="ชื่อคุณวุฒิ">
          <input name="name" required placeholder="เช่น Top Producer" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ใช้กับตำแหน่ง">
          <select name="scope" defaultValue="ALL" className={inputClass}>
            {Object.entries(QUAL_SCOPE_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ตัวชี้วัด">
          <select name="metric" value={metric} onChange={(e) => setMetric(e.target.value as QualMetric)} className={inputClass}>
            {Object.entries(QUAL_METRIC_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label} ({QUAL_METRIC_PERIOD[k as QualMetric]})
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={isPct ? "เกณฑ์ขั้นต่ำ (%)" : "เกณฑ์ขั้นต่ำ"}>
        <input name="threshold" type="number" step="0.01" defaultValue={isPct ? 100 : 50000} className={inputClass} />
      </Field>
      {TWO_MONTH_METRICS.has(metric) && (
        <Field label="เดือนเริ่มรอบ 2 เดือน" hint="เช่น 1 = รอบ ม.ค.-ก.พ., มี.ค.-เม.ย., ...">
          <select name="periodStartMonth" defaultValue={1} className={inputClass}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                เดือน {m}
              </option>
            ))}
          </select>
        </Field>
      )}
      <p className="text-xs text-[var(--muted)]">*ระบบยึดข้อมูลตามรอบที่บันทึกในแอป (รายเดือน/ไตรมาส/ปี/2 เดือน)</p>
      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังเพิ่ม…" : "เพิ่มคุณวุฒิ"}
      </PrimeButton>
    </form>
  );
}
