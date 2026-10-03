import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { fmt } from "@/lib/domain/income";
import { computeQualificationsProgress, qualMetricUnit, QUAL_METRIC_LABEL, QUAL_SCOPE_LABEL, type QualificationDef, type QualMetric, type QualScope } from "@/lib/domain/qualifications";
import { loadIncomeContext } from "@/lib/services/income-context";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/primitives";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { AddQualificationForm } from "./AddQualificationForm";
import { DeleteQualButton } from "./DeleteQualButton";

export default async function QualTrackPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const [qualRows, members] = await Promise.all([prisma.qualification.findMany({ orderBy: { createdAt: "asc" } }), prisma.member.findMany()]);
  const qualifications: QualificationDef[] = qualRows.map((q) => ({
    id: q.id,
    icon: q.icon,
    name: q.name,
    scope: q.scope as QualScope,
    metric: q.metric as QualMetric,
    threshold: q.threshold,
    periodStartMonth: q.periodStartMonth,
  }));
  const membersById = new Map(members.map((m) => [m.id, m]));

  const ctx = await loadIncomeContext(year);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-extrabold text-[var(--navy)]">ติดตามคุณวุฒิ</h1>
        <p className="mb-3 text-sm text-[var(--muted)]">ดูว่าใครติดคุณวุฒิแล้วบ้าง และใครใกล้ถึงแค่ไหน</p>
        <MonthYearPicker action="/qualtrack" year={year} month={month} />
      </Card>

      {qualifications.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">ยังไม่มีคุณวุฒิในระบบ — เพิ่มได้ด้านล่าง (แอดมินเท่านั้น)</p>
        </Card>
      ) : (
        qualifications.map((q) => {
          const results = [...membersById.values()]
            .map((su) => {
              const progress = computeQualificationsProgress(ctx, su.id, year, month, [q]);
              return progress[0] ? { user: su, ...progress[0] } : null;
            })
            .filter((r): r is NonNullable<typeof r> => !!r);
          const achievers = results.filter((r) => r.achieved);
          const pending = results
            .filter((r) => !r.achieved)
            .sort((a, b) => (b.qual.threshold > 0 ? b.currentValue / b.qual.threshold : 0) - (a.qual.threshold > 0 ? a.currentValue / a.qual.threshold : 0));
          const threshDisplay = q.metric === "active" ? (q.threshold >= 1 ? "ต้อง Active" : "ไม่จำกัด") : q.metric === "persistency" || q.metric.includes("Pct") ? `${(q.threshold * 100).toFixed(0)}%` : fmt(q.threshold);

          return (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-[var(--navy)]">
                    <span className="grid size-8 place-items-center rounded-lg bg-[var(--orange-soft)] text-base">{q.icon}</span>
                    {q.name}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {QUAL_SCOPE_LABEL[q.scope]} · {QUAL_METRIC_LABEL[q.metric]} ≥ {threshDisplay}
                  </p>
                </div>
                {me.isAdmin && <DeleteQualButton id={q.id} name={q.name} />}
              </div>

              <div className="mt-3 text-sm font-extrabold">🏆 ติดคุณวุฒิแล้ว ({achievers.length} คน)</div>
              {achievers.length === 0 ? (
                <p className="mt-1 text-sm text-[var(--muted)]">ยังไม่มีใครติดคุณวุฒินี้เลย</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {achievers.map((a) => (
                    <span key={a.user.id} className="flex items-center gap-1.5 rounded-full bg-[var(--orange-soft)] py-1 pl-1.5 pr-3 text-xs font-bold text-[var(--orange-cta)]">
                      <Avatar name={a.user.name} photo={a.user.photo} size={20} />
                      {a.user.name}
                    </span>
                  ))}
                </div>
              )}

              {pending.length > 0 && (
                <>
                  <div className="mt-4 text-sm font-extrabold">🎯 ใกล้ถึงเป้า (เรียงจากใกล้สุด)</div>
                  <div className="mt-2 space-y-2">
                    {pending.slice(0, 15).map((p, idx) => {
                      const pct = p.qual.threshold > 0 ? Math.min(p.currentValue / p.qual.threshold, 1) : 0;
                      const medal = idx === 0 ? "🥇 " : idx === 1 ? "🥈 " : idx === 2 ? "🥉 " : "";
                      const remStr = p.isPct ? `${(p.remaining * 100).toFixed(0)}%` : fmt(p.remaining);
                      return (
                        <div key={p.user.id} className="rounded-xl border border-[var(--line)] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5 text-xs font-extrabold">
                              <Avatar name={p.user.name} photo={p.user.photo} size={22} />
                              <span className="truncate">
                                {medal}
                                {p.user.name}
                              </span>
                            </span>
                            <span className="text-xs font-extrabold text-[var(--orange-cta)]">{Math.round(pct * 100)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg)]">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--navy)] to-[var(--orange)]" style={{ width: `${pct * 100}%` }} />
                          </div>
                          <div className="mt-1 text-[11px] text-[var(--muted)]">
                            เหลืออีก <b>{remStr}</b> {QUAL_METRIC_LABEL[p.qual.metric]} ({qualMetricUnit(p.qual.metric)})
                          </div>
                        </div>
                      );
                    })}
                    {pending.length > 15 && <p className="text-xs text-[var(--muted)]">...และอีก {pending.length - 15} คน</p>}
                  </div>
                </>
              )}
            </Card>
          );
        })
      )}

      {me.isAdmin && (
        <Card>
          <h2 className="mb-3 text-base font-extrabold text-[var(--navy)]">เพิ่มคุณวุฒิ / รางวัลใหม่</h2>
          <AddQualificationForm />
        </Card>
      )}
    </div>
  );
}
