import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { AL_ROLES, children, descendants, fmt, getActual, getGoal, teamInclusiveActualFYC } from "@/lib/domain/income";
import { computeAlerts } from "@/lib/domain/alerts";
import { loadIncomeContext } from "@/lib/services/income-context";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/primitives";
import { MonthYearPicker } from "@/components/MonthYearPicker";

function fmtPct(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}

export default async function TeamReportPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const membersById = new Map(members.map((m) => [m.id, m]));
  const leaders = members.filter((m) => AL_ROLES.includes(m.role as (typeof AL_ROLES)[number]) || m.role === "VP" || m.role === "AGP").sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));

  const ctx = await loadIncomeContext(year);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-extrabold text-[var(--navy)]">สรุปผลงานทีมตามสายงาน</h1>
        <p className="mb-3 text-sm text-[var(--muted)]">ผลรวมของแต่ละหัวหน้าทีมนับรวมทั้งสายใต้สังกัด (ทุกระดับ)</p>
        <MonthYearPicker action="/team-report" year={year} month={month} />
      </Card>

      {leaders.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">ยังไม่มีตำแหน่งหัวหน้าทีมในระบบ</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {leaders.map((u) => {
            const parent = u.parentId ? membersById.get(u.parentId) : null;
            const directKids = children(ctx, u.id);
            const allTeam = descendants(ctx, u.id);
            const goal = getGoal(ctx, u.id, year, month);
            const actual = getActual(ctx, u.id, year, month);
            const teamTargetFYP = (goal.targetFYP || 0) + allTeam.reduce((s, d) => s + (getGoal(ctx, d.id, year, month).targetFYP || 0), 0);
            const teamActualFYP = (actual.actualFYP || 0) + allTeam.reduce((s, d) => s + (getActual(ctx, d.id, year, month).actualFYP || 0), 0);
            const teamTargetNBC = (goal.targetNBC || 0) + allTeam.reduce((s, d) => s + (getGoal(ctx, d.id, year, month).targetNBC || 0), 0);
            const teamActualNBC = (actual.actualNBC || 0) + allTeam.reduce((s, d) => s + (getActual(ctx, d.id, year, month).actualNBC || 0), 0);
            const teamFYC = teamInclusiveActualFYC(ctx, u.id, year, month);
            const fypPct = teamTargetFYP > 0 ? teamActualFYP / teamTargetFYP : 0;
            const nbcPct = teamTargetNBC > 0 ? teamActualNBC / teamTargetNBC : 0;
            const myAlerts = computeAlerts(ctx, u.id, year, month);
            const teamAlertCount = allTeam.reduce((sum, d) => sum + computeAlerts(ctx, d.id, year, month).length, 0) + myAlerts.length;

            return (
              <Card key={u.id}>
                <div className="flex items-center gap-2">
                  <Avatar name={u.name} photo={u.photo} size={34} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold">
                      {u.name} <span className="font-semibold text-[var(--muted)]">· {ROLE_LABEL[u.role as never]}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {parent ? `หัวหน้าสังกัด: ${parent.name} (${ROLE_LABEL[parent.role as never]})` : "ตำแหน่งสูงสุดในสาย"} · ทีมทั้งสาย {allTeam.length} คน (ตรง {directKids.length} คน)
                  {teamAlertCount > 0 && <span className="font-extrabold text-red-600"> · แจ้งเตือน {teamAlertCount} รายการ</span>}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <MiniKpi label="🎯 Target FYP ทีม" value={fmt(teamTargetFYP)} />
                  <MiniKpi label="📈 Actual FYP ทีม" value={fmt(teamActualFYP)} sub={`${fmtPct(fypPct)} ของเป้า`} />
                  <MiniKpi label="🎯 Target NBC ทีม" value={fmt(teamTargetNBC)} />
                  <MiniKpi label="📈 Actual NBC ทีม" value={fmt(teamActualNBC)} sub={`${fmtPct(nbcPct)} ของเป้า`} />
                </div>
                <div className="mt-2">
                  <MiniKpi label="💰 FYC ทีมทั้งสาย (เดือนนี้)" value={fmt(teamFYC)} />
                </div>
                <Link href={`/dashboard?memberId=${u.id}&month=${month}&year=${year}`} className="mt-3 inline-block text-xs font-bold text-[var(--navy)] underline">
                  ดูรายละเอียด →
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] p-2.5">
      <div className="text-[10px] font-bold text-[var(--muted)]">{label}</div>
      <div className="text-sm font-extrabold text-[var(--navy)]">{value}</div>
      {sub && <div className="text-[10px] font-bold text-[var(--muted)]">{sub}</div>}
    </div>
  );
}
