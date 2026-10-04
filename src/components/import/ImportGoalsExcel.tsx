"use client";

import { useState, useTransition } from "react";
import { PrimeButton } from "@/components/ui/primitives";
import { previewGoalsExcelImport, commitGoalsImport, type GoalsMatchedRow, type UnmatchedImportRow } from "@/app/actions/import";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function ImportGoalsExcel() {
  const now = new Date();
  const [tplMonth, setTplMonth] = useState(now.getMonth() + 1);
  const [tplYear, setTplYear] = useState(now.getFullYear());
  const [preview, setPreview] = useState<{ matched: GoalsMatchedRow[]; unmatched: UnmatchedImportRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setResult(null);
    setPreview(null);
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await previewGoalsExcelImport(fd);
      if ("error" in res) setError(res.error);
      else setPreview(res);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const res = await commitGoalsImport(preview.matched);
      if ("error" in res) setError(res.error);
      else {
        setResult(`นำเข้าสำเร็จ ${res.count} รายการ`);
        setPreview(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--bg)] p-2.5">
        <span className="text-xs font-bold text-[var(--muted)]">แบบฟอร์มสำหรับเดือน</span>
        <select value={tplMonth} onChange={(e) => setTplMonth(+e.target.value)} className="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-xs font-bold">
          {MONTHS_TH.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select value={tplYear} onChange={(e) => setTplYear(+e.target.value)} className="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-xs font-bold">
          {Array.from({ length: 5 }, (_, i) => tplYear - 2 + i).map((y) => (
            <option key={y} value={y}>
              {y + 543}
            </option>
          ))}
        </select>
        <a href={`/api/import/goals-template?year=${tplYear}&month=${tplMonth}`} className="text-sm font-bold text-[var(--navy)] underline underline-offset-2">
          ⬇️ ดาวน์โหลดแบบฟอร์ม Excel
        </a>
      </div>
      <label className="inline-block cursor-pointer rounded-xl border border-dashed border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--navy)] hover:bg-[var(--orange-soft)]">
        📁 เลือกไฟล์ Excel ที่กรอกแล้ว
        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={isPending} />
      </label>

      {isPending && <p className="text-sm text-[var(--muted)]">กำลังประมวลผล...</p>}
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      {result && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{result}</p>}

      {preview && (
        <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <div className="text-xs font-bold text-[var(--muted)]">✅ จับคู่ได้</div>
              <div className="text-xl font-extrabold text-green-700">{preview.matched.length}</div>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <div className="text-xs font-bold text-[var(--muted)]">⚠️ จับคู่ไม่ได้</div>
              <div className="text-xl font-extrabold text-red-700">{preview.unmatched.length}</div>
            </div>
          </div>

          {preview.matched.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)]">
                  <tr>
                    <th className="p-2 text-left">ชื่อ</th>
                    <th className="p-2 text-left">เดือน</th>
                    <th className="p-2 text-right">เป้า FYP</th>
                    <th className="p-2 text-right">เป้า NBC</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.matched.slice(0, 60).map((r, i) => (
                    <tr key={i} className="border-t border-[var(--line)]">
                      <td className="p-2">{r.memberName}</td>
                      <td className="p-2">
                        {MONTHS_TH[r.month - 1]} {r.year + 543}
                      </td>
                      <td className="p-2 text-right">{r.targetFYP.toLocaleString()}</td>
                      <td className="p-2 text-right">{r.targetNBC.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.matched.length > 60 && <p className="p-2 text-xs text-[var(--muted)]">...และอีก {preview.matched.length - 60} รายการ</p>}
            </div>
          )}

          {preview.unmatched.length > 0 && (
            <div className="rounded-xl bg-yellow-50 p-3 text-sm">
              <div className="font-bold text-yellow-800">จับคู่ไม่ได้ {preview.unmatched.length} รายการ</div>
              <div className="mt-1 text-yellow-700">
                {preview.unmatched
                  .slice(0, 8)
                  .map((u) => `${u.name || "(ไม่ทราบชื่อ)"}${u.code ? ` [${u.code}]` : ""}`)
                  .join(", ")}
                {preview.unmatched.length > 8 ? " ..." : ""}
              </div>
            </div>
          )}

          {preview.matched.length > 0 && (
            <PrimeButton type="button" onClick={handleConfirm} disabled={isPending}>
              ✅ ยืนยันนำเข้า {preview.matched.length} รายการ
            </PrimeButton>
          )}
        </div>
      )}
    </div>
  );
}
