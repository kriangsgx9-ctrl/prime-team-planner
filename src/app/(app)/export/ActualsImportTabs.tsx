"use client";

import { useState } from "react";
import { cn } from "@/components/ui/primitives";
import { ImportActualsExcel } from "@/components/import/ImportActualsExcel";
import { ImportActualsPdf } from "@/components/import/ImportActualsPdf";

// Excel and PDF are two different FILE FORMATS for importing the same kind
// of data (actuals) — presenting them as a method switch inside one card
// reads more clearly than two separate stacked cards that look unrelated.
export function ActualsImportTabs() {
  const [method, setMethod] = useState<"excel" | "pdf">("excel");

  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl bg-[var(--bg)] p-1">
        <button
          type="button"
          onClick={() => setMethod("excel")}
          className={cn("rounded-lg px-3.5 py-1.5 text-sm font-bold transition", method === "excel" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--muted)]")}
        >
          📊 ไฟล์ Excel
        </button>
        <button
          type="button"
          onClick={() => setMethod("pdf")}
          className={cn("rounded-lg px-3.5 py-1.5 text-sm font-bold transition", method === "pdf" ? "bg-white text-[var(--navy)] shadow-sm" : "text-[var(--muted)]")}
        >
          📄 ไฟล์ PDF (รายงาน FWD)
        </button>
      </div>
      {method === "excel" ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">ดาวน์โหลดแบบฟอร์ม กรอกข้อมูล แล้วอัปโหลดกลับมา ระบบจะจับคู่คนด้วยรหัสตัวแทนหรือชื่อให้อัตโนมัติ</p>
          <ImportActualsExcel />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">อัปโหลดไฟล์ PDF รายงานผลงานเพื่อคำนวณโบนัสฯ ระบบจะอ่านและตรวจสอบยอดรวมให้อัตโนมัติก่อนนำเข้า</p>
          <ImportActualsPdf />
        </div>
      )}
    </div>
  );
}
