"use client";

import { useState, useTransition } from "react";
import { PrimeButton } from "@/components/ui/primitives";
import { previewBackupRestore, commitBackupRestore, type BackupPreview } from "@/app/actions/backup";

export function BackupRestore() {
  const [preview, setPreview] = useState<(BackupPreview & { raw: string }) | null>(null);
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
      const res = await previewBackupRestore(fd);
      if ("error" in res) setError(res.error);
      else setPreview(res);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    if (!confirm("ยืนยันกู้คืนข้อมูล? ข้อมูลปัจจุบันทั้งหมดในระบบ (สมาชิก เป้าหมาย ผลงาน การตั้งค่า) จะถูกเขียนทับด้วยข้อมูลจากไฟล์นี้ทันที และย้อนกลับไม่ได้")) return;
    startTransition(async () => {
      const res = await commitBackupRestore(preview.raw);
      if ("error" in res) setError(res.error);
      else {
        setResult("กู้คืนข้อมูลสำเร็จ — ทุกบัญชี (รวมถึงของคุณ) ถูกออกจากระบบโดยอัตโนมัติ กรุณาเข้าสู่ระบบใหม่");
        setPreview(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-[var(--navy)]">ส่งออกไฟล์สำรองข้อมูลทั้งระบบ</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">ไฟล์เดียวรวมข้อมูลสมาชิก เป้าหมาย ผลงาน การประเมิน คุณวุฒิ และการตั้งค่าทั้งหมด — เก็บไว้เป็นระยะเพื่อความปลอดภัย</p>
        <a href="/api/export/backup" className="mt-2 inline-block">
          <PrimeButton type="button" variant="navy">
            💾 ดาวน์โหลดไฟล์สำรอง
          </PrimeButton>
        </a>
      </div>

      <div className="border-t border-[var(--line)] pt-4">
        <h3 className="text-sm font-extrabold text-red-700">กู้คืนข้อมูลจากไฟล์สำรอง</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">⚠️ การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมดในระบบ ใช้เฉพาะตอนต้องการย้อนกลับไปยังจุดที่สำรองไว้เท่านั้น</p>
        <label className="mt-2 inline-block cursor-pointer rounded-xl border border-dashed border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--navy)] hover:bg-[var(--orange-soft)]">
          📁 เลือกไฟล์สำรอง (.json)
          <input type="file" accept=".json,application/json" className="hidden" onChange={handleFile} disabled={isPending} />
        </label>

        {isPending && <p className="mt-2 text-sm text-[var(--muted)]">กำลังประมวลผล...</p>}
        {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        {result && <p className="mt-2 rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">{result}</p>}

        {preview && (
          <div className="mt-3 space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Stat label="👥 สมาชิก" value={preview.memberCount} />
              <Stat label="🎯 เป้าหมาย" value={preview.goalCount} />
              <Stat label="📊 ผลงาน" value={preview.actualCount} />
              <Stat label="📝 ประเมิน" value={preview.evaluationCount} />
              <Stat label="🏆 คุณวุฒิ" value={preview.qualificationCount} />
            </div>
            <p className="text-xs text-[var(--muted)]">สำรองไว้เมื่อ: {preview.exportedAt ? new Date(preview.exportedAt).toLocaleString("th-TH") : "ไม่ทราบ"}</p>
            <PrimeButton type="button" onClick={handleConfirm} disabled={isPending}>
              ⚠️ กู้คืนข้อมูล (เขียนทับข้อมูลปัจจุบันทั้งหมด)
            </PrimeButton>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-2 text-center">
      <div className="text-[10px] font-bold text-[var(--muted)]">{label}</div>
      <div className="text-lg font-extrabold text-[var(--navy)]">{value}</div>
    </div>
  );
}
