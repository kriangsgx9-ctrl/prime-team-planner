"use client";

import { useActionState, useState } from "react";
import { setEvaluationAction } from "@/app/actions/evaluations";
import { evalScoreAvg, evalScoreColorClass, getEvalCategories, quarterLabel } from "@/lib/domain/evaluations";
import type { OrgRole } from "@/lib/domain/income";
import { ROLE_LABEL } from "@/lib/domain/org";
import { Avatar } from "@/components/ui/Avatar";
import { FormError, PrimeButton } from "@/components/ui/primitives";

interface HistoryEntry {
  year: number;
  quarter: number;
  scores: Record<string, number>;
  strengths: string | null;
  improvements: string | null;
  developmentPlan: string | null;
}

export function EvalCard({
  member,
  year,
  quarter,
  existing,
  history,
  prevDevelopmentPlan,
}: {
  member: { id: string; name: string; role: string; photo: string | null };
  year: number;
  quarter: number;
  existing: { scores: unknown; strengths: string | null; improvements: string | null; developmentPlan: string | null; followUpStatus: string | null } | null;
  history: HistoryEntry[];
  prevDevelopmentPlan: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(setEvaluationAction, undefined);
  const [scores, setScores] = useState<Record<string, number>>((existing?.scores as Record<string, number>) ?? {});
  const role = member.role as OrgRole;
  const avg = evalScoreAvg(scores, role);
  const categories = getEvalCategories(role);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Avatar name={member.name} photo={member.photo} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold">{member.name}</div>
          <div className="text-xs text-[var(--muted)]">{ROLE_LABEL[role]}</div>
        </div>
        <span className={`rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs font-extrabold ${evalScoreColorClass(avg)}`}>{avg === null ? "ยังไม่ประเมิน" : `⭐ ${avg.toFixed(1)}`}</span>
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-[var(--navy)] px-3 py-1.5 text-xs font-bold text-[var(--navy)]">
          {editing ? "ปิด" : existing ? "แก้ไข" : "ประเมิน"}
        </button>
      </div>

      {editing && (
        <form action={action} className="mt-4 space-y-4 border-t border-dashed border-[var(--line)] pt-4">
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="year" value={year} />
          <input type="hidden" name="quarter" value={quarter} />
          <input type="hidden" name="role" value={role} />

          {prevDevelopmentPlan && (
            <div className="rounded-xl bg-[var(--bg)] p-3">
              <div className="text-xs font-bold text-[var(--muted)]">📌 แผนพัฒนาที่ตกลงไว้ไตรมาสก่อน</div>
              <div className="mt-1 text-sm">{prevDevelopmentPlan}</div>
              <label className="mt-2 block">
                <span className="block text-xs font-bold text-[var(--muted)]">ทำตามแผนนี้หรือไม่?</span>
                <select name="followUpStatus" defaultValue={""} className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm">
                  <option value="">— ยังไม่ระบุ —</option>
                  <option value="ทำครบถ้วน">ทำครบถ้วน</option>
                  <option value="ทำบางส่วน">ทำบางส่วน</option>
                  <option value="ยังไม่ได้ทำ">ยังไม่ได้ทำ</option>
                </select>
              </label>
            </div>
          )}

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase text-[var(--navy)]">ให้คะแนนแต่ละด้าน (1 = ต้องปรับปรุงมาก, 5 = ดีเยี่ยม)</div>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">
                    {cat.icon} {cat.label}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setScores((s) => ({ ...s, [cat.key]: n }))}
                        className={`size-7 rounded-lg border text-xs font-bold ${scores[cat.key] === n ? "border-[var(--orange-cta)] bg-[var(--orange-cta)] text-white" : "border-[var(--line)] text-[var(--muted)]"}`}
                      >
                        {n}
                      </button>
                    ))}
                    <input type="hidden" name={`score_${cat.key}`} value={scores[cat.key] ?? ""} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block text-xs font-bold text-[var(--muted)]">💪 จุดแข็ง</span>
            <textarea name="strengths" defaultValue={existing?.strengths ?? ""} rows={2} placeholder="สิ่งที่ทำได้ดีในไตรมาสนี้" className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-[var(--muted)]">🎯 จุดที่ต้องพัฒนา</span>
            <textarea name="improvements" defaultValue={existing?.improvements ?? ""} rows={2} placeholder="สิ่งที่ควรปรับปรุง" className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-[var(--muted)]">📅 แผนพัฒนา 90 วันถัดไป</span>
            <textarea name="developmentPlan" defaultValue={existing?.developmentPlan ?? ""} rows={2} placeholder="เช่น อบรมหลักสูตร X, โค้ชปิดการขายทุกสัปดาห์" className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1.5 text-sm" />
          </label>

          <FormError error={state?.error} />
          <PrimeButton type="submit" disabled={pending}>
            {pending ? "กำลังบันทึก…" : "บันทึกผลประเมิน"}
          </PrimeButton>

          {history.length > 0 && (
            <div className="border-t border-dashed border-[var(--line)] pt-3">
              <div className="mb-2 text-xs font-extrabold uppercase text-[var(--navy)]">ประวัติย้อนหลัง</div>
              <div className="space-y-2">
                {history.map((h, idx) => {
                  const hAvg = evalScoreAvg(h.scores, role);
                  return (
                    <details key={idx} className="rounded-xl border border-[var(--line)] p-2.5">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold">
                        <span>{quarterLabel(h.year, h.quarter)}</span>
                        <span className={evalScoreColorClass(hAvg)}>{hAvg === null ? "—" : `⭐ ${hAvg.toFixed(1)}`}</span>
                      </summary>
                      <div className="mt-2 space-y-1 text-xs leading-relaxed">
                        {h.strengths && (
                          <div>
                            <b className="text-[var(--navy)]">จุดแข็ง:</b> {h.strengths}
                          </div>
                        )}
                        {h.improvements && (
                          <div>
                            <b className="text-[var(--navy)]">จุดที่ต้องพัฒนา:</b> {h.improvements}
                          </div>
                        )}
                        {h.developmentPlan && (
                          <div>
                            <b className="text-[var(--navy)]">แผนพัฒนา:</b> {h.developmentPlan}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
