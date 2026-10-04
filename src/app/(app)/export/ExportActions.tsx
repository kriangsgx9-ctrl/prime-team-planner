"use client";

import { useState } from "react";
import { Card, IconBadge, inputClass, PrimeButton } from "@/components/ui/primitives";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// Both export formats need the same month/year, so the picker lives here —
// right next to the two actions that actually read it — instead of at the
// top of the whole import/export page where it looked shared but only ever
// applied to export.
export function ExportActions() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className={inputClass}>
            {MONTHS_TH.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)} className={inputClass}>
            {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y + 543}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
            <IconBadge icon="📤" variant="orange" />
            ไฟล์ Excel
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">ข้อมูลของเดือนที่เลือกสำหรับสมาชิกทุกคน แยกเป็น 3 แท็บ: Performance Report, Goals, Actuals</p>
          <a href={`/api/export/excel?year=${year}&month=${month}`}>
            <PrimeButton type="button">📤 ส่งออกไฟล์ Excel (.xlsx)</PrimeButton>
          </a>
        </Card>

        <Card>
          <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
            <IconBadge icon="📄" variant="soft" />
            รายงาน PDF
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">สรุปผลงานเทียบเป้าหมายและรายได้ประมาณการของทุกคน พร้อมพิมพ์หรือส่งให้ทีม</p>
          <a href={`/api/export/pdf?year=${year}&month=${month}`}>
            <PrimeButton type="button" variant="navy">
              📄 ส่งออกรายงาน PDF
            </PrimeButton>
          </a>
        </Card>
      </div>
    </div>
  );
}
