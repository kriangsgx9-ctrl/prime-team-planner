"use client";

import { useState, useTransition } from "react";
import { PrimeButton, inputClass } from "@/components/ui/primitives";
import { previewActualsPdfImport, commitActualsPdfImport, type PdfImportPreview } from "@/app/actions/import";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function ImportActualsPdf() {
  const now = new Date();
  const [yearBE, setYearBE] = useState(now.getFullYear() + 543);
  const [preview, setPreview] = useState<PdfImportPreview | null>(null);
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
    fd.set("yearBE", String(yearBE));
    startTransition(async () => {
      const res = await previewActualsPdfImport(fd);
      if ("error" in res) setError(res.error);
      else {
        setPreview(res);
        if (res.period) setYearBE(res.period.yearBE);
      }
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const res = await commitActualsPdfImport(preview.matched);
      if ("error" in res) setError(res.error);
      else {
        setResult(`นำเข้าสำเร็จ ${res.count} รายการ`);
        setPreview(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1">
          <span className="block text-xs font-bold text-[var(--muted)]">ปี พ.ศ. (เติมอัตโนมัติถ้าตรวจพบในไฟล์)</span>
          <input type="number" className={`${inputClass} w-32`} value={yearBE} onChange={(e) => setYearBE(parseInt(e.target.value) || yearBE)} />
        </label>
        <label className="cursor-pointer rounded-xl border border-dashed border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--navy)] hover:bg-[var(--orange-soft)]">
          📁 เลือกไฟล์ PDF รายงานผลงาน (FWD)
          <input type="file" accept=".pdf" className="hidden" onChange={handleFile} disabled={isPending} />
        </label>
      </div>

      {isPending && (
        <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-[var(--navy)] border-t-transparent" /> กำลังอ่านไฟล์...
        </p>
      )}
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      {result && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{result}</p>}

      {preview && (
        <div className="space-y-3 rounded-xl border border-[var(--line)] p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <div className="text-xs font-bold text-[var(--muted)]">✅ คนที่จับคู่ได้</div>
              <div className="text-xl font-extrabold text-green-700">{new Set(preview.matched.map((m) => m.memberId)).size}</div>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <div className="text-xs font-bold text-[var(--muted)]">⚠️ จับคู่ไม่ได้</div>
              <div className="text-xl font-extrabold text-red-700">{preview.unmatchedAgents.length}</div>
            </div>
          </div>

          {preview.mismatches === null ? (
            <div className="rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm">
              <div className="font-bold text-yellow-800">ℹ️ ตรวจสอบยอดรวมไม่ได้</div>
              <div className="mt-1 text-yellow-700">ไฟล์นี้ไม่มีแถว &quot;ผลงานทีมรวม&quot; ให้เทียบยอด — แนะนำให้ตรวจตัวเลขเองก่อนนำเข้า</div>
            </div>
          ) : preview.mismatches.length ? (
            <div className="rounded-xl border-l-4 border-red-400 bg-red-50 p-3 text-sm">
              <div className="font-bold text-red-800">⚠️ ยอดรวมที่ดึงได้ไม่ตรงกับ &quot;ผลงานทีมรวม&quot; ในรายงาน — ควรตรวจสอบก่อนนำเข้า</div>
              <div className="mt-1 space-y-0.5 text-red-700">
                {preview.mismatches.map((mm, i) => (
                  <div key={i}>
                    <b>{MONTHS_TH[mm.month - 1]}:</b>{" "}
                    {Math.abs(mm.sumFyp - mm.expFyp) > 2 && `FYP ดึงได้ ${mm.sumFyp.toLocaleString()} แต่รายงานระบุ ${mm.expFyp.toLocaleString()} `}
                    {Math.abs(mm.sumFyc - mm.expFyc) > 2 && `FYC ดึงได้ ${mm.sumFyc.toLocaleString()} แต่รายงานระบุ ${mm.expFyc.toLocaleString()} `}
                    {Math.abs(mm.sumNbcfy - mm.expNbcfy) > 2 && `NBC ดึงได้ ${mm.sumNbcfy.toLocaleString()} แต่รายงานระบุ ${mm.expNbcfy.toLocaleString()}`}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-l-4 border-green-400 bg-green-50 p-3 text-sm">
              <div className="font-bold text-green-800">✅ ยอดรวมตรงกับ &quot;ผลงานทีมรวม&quot; ในรายงานทุกเดือน</div>
            </div>
          )}

          <p className="text-sm text-[var(--muted)]">
            {preview.period
              ? <>ตรวจพบว่าไฟล์นี้คือรายงานผลงานเดือน <b>{MONTHS_TH[preview.period.month - 1]} {preview.period.yearBE}</b> (เติมปีให้อัตโนมัติแล้ว)</>
              : "ไม่พบข้อความระบุเดือน/ปีของรายงานในไฟล์ — ตรวจสอบปีที่กรอกด้านบนให้ถูกต้องเอง"}
          </p>
          <p className="text-sm text-[var(--muted)]">
            ไฟล์นี้มีข้อมูลเดือน: <b>{preview.detectedMonths.length ? preview.detectedMonths.map((m) => MONTHS_TH[m - 1]).join(", ") : "ตรวจไม่พบ (ใช้ ม.ค. เป็นจุดเริ่มต้นแทน)"}</b>
          </p>
          <p className="text-xs text-[var(--muted)]">*คอลัมน์ YTD (สะสมทั้งปี) ในรายงานจะถูกตัดออกอัตโนมัติ ไม่นับเป็นเดือนแยก</p>

          {preview.matched.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-xl border border-[var(--line)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--card)]">
                  <tr>
                    <th className="p-2 text-left">ชื่อ</th>
                    <th className="p-2 text-left">เดือน</th>
                    <th className="p-2 text-right">FYP</th>
                    <th className="p-2 text-right">NBC</th>
                    <th className="p-2 text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.matched.slice(0, 60).map((r, i) => (
                    <tr key={i} className="border-t border-[var(--line)]">
                      <td className="p-2">{r.memberName}</td>
                      <td className="p-2">{MONTHS_TH[r.month - 1]}</td>
                      <td className="p-2 text-right">{r.actualFYP.toLocaleString()}</td>
                      <td className="p-2 text-right">{r.actualNBC.toLocaleString()}</td>
                      <td className="p-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            r.agentStatus === "ACTIVE" ? "bg-green-100 text-green-700" : r.agentStatus === "TERMINATED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {r.agentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.matched.length > 60 && <p className="p-2 text-xs text-[var(--muted)]">...และอีก {preview.matched.length - 60} รายการ</p>}
            </div>
          )}

          {preview.unmatchedAgents.length > 0 && (
            <div className="rounded-xl bg-yellow-50 p-3 text-sm">
              <div className="font-bold text-yellow-800">⚠️ จับคู่ไม่ได้ {preview.unmatchedAgents.length} คน</div>
              <div className="mt-1 text-yellow-700">
                {preview.unmatchedAgents
                  .slice(0, 8)
                  .map((a) => `${a.name || "(ไม่ทราบชื่อ)"}${a.agentCode ? ` [${a.agentCode}]` : " (ไม่พบรหัสในไฟล์)"}`)
                  .join(", ")}
                {preview.unmatchedAgents.length > 8 ? " ..." : ""} — ตรวจสอบรหัสตัวแทนที่หน้า &quot;จัดการทีม&quot; ให้ตรงกับไฟล์นี้
              </div>
            </div>
          )}

          {preview.matched.length > 0 && (
            <>
              <PrimeButton type="button" onClick={handleConfirm} disabled={isPending}>
                ✅ ยืนยันนำเข้า {preview.matched.length} รายการ
              </PrimeButton>
              <p className="text-xs text-[var(--muted)]">*เดือนที่มีข้อมูลในไฟล์จะเขียนทับข้อมูลเดิม เดือนที่ไม่มีข้อมูล (ว่างทั้งหมด) จะไม่ถูกแตะต้อง</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
