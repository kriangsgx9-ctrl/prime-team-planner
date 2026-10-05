import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { computeIncome, fmt } from "@/lib/domain/income";
import { computeAlerts } from "@/lib/domain/alerts";
import { loadIncomeContext } from "@/lib/services/income-context";
import { Avatar } from "@/components/ui/Avatar";
import { Card, IconBadge } from "@/components/ui/primitives";
import { PeriodPicker } from "@/components/PeriodPicker";

const QUICK_LINKS = [
  { href: "/goals", label: "กำหนดเป้าหมาย", icon: "🎯" },
  { href: "/actuals", label: "บันทึกผลการดำเนินงาน", icon: "✏️" },
  { href: "/income", label: "ประมาณการรายได้", icon: "🧮" },
  { href: "/alerts", label: "การแจ้งเตือนความเสี่ยง", icon: "🚨" },
];

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ memberId?: string; year?: string; month?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));
  const memberId = sp.memberId ?? sorted[0]?.id;
  const member = sorted.find((m) => m.id === memberId) ?? sorted[0];

  if (!member) {
    return (
      <Card>
        <p>ยังไม่มีสมาชิกในระบบ — เพิ่มได้ที่หน้าจัดการทีม</p>
      </Card>
    );
  }

  const [goal, directReports] = await Promise.all([
    prisma.goal.findUnique({ where: { memberId_year_month: { memberId: member.id, year, month } } }),
    prisma.member.findMany({ where: { parentId: member.id } }),
  ]);

  const ctx = await loadIncomeContext(year);
  const income = computeIncome(ctx, member.id, year, month);
  const myAlerts = computeAlerts(ctx, member.id, year, month);
  const actual = ctx.actualsByKey.get(`${member.id}|${year}-${month}`);

  const targetFYP = goal?.targetFYP ?? 0;
  const targetNBC = goal?.targetNBC ?? 0;
  const actualFYP = actual?.actualFYP ?? 0;
  const actualNBC = actual?.actualNBC ?? 0;

  const reportRows = directReports
    .map((r) => {
      const rActual = ctx.actualsByKey.get(`${r.id}|${year}-${month}`);
      return { member: r, actualNBC: rActual?.actualNBC ?? 0 };
    })
    .sort((a, b) => b.actualNBC - a.actualNBC);

  return (
    <div className="space-y-4">
      <Card>
        <PeriodPicker members={sorted} roleLabel={ROLE_LABEL} memberId={member.id} year={year} month={month} action="/dashboard" />
      </Card>

      <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow">
        <Image src="/images/hero/skyline.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)]/92 via-[var(--navy-light)]/88 to-[var(--orange)]/80" />
        <div className="relative flex items-center gap-3">
          <Avatar name={member.name} photo={member.photo} size={64} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide opacity-80">
              ภาพรวม · {month}/{year + 543}
            </div>
            <div className="text-lg font-extrabold">
              {member.name} <span className="text-sm font-semibold opacity-80">· {ROLE_LABEL[member.role]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="FYP" target={targetFYP} actual={actualFYP} />
        <KpiCard label="NBC" target={targetNBC} actual={actualNBC} />
      </div>

      <Card>
        <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="💰" variant="orange" />
          รายได้ประมาณการเดือนนี้
        </h2>
        <div className="text-2xl font-extrabold text-[var(--orange-cta)]">฿ {fmt(income.total)}</div>
        <Link href={`/income?memberId=${member.id}&month=${month}&year=${year}`} className="mt-1 inline-block text-xs font-bold text-[var(--navy)] underline">
          ดูรายละเอียด →
        </Link>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="⚡" variant="navy" />
          ทางลัด
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={`${l.href}?memberId=${member.id}&month=${month}&year=${year}`} className="flex flex-col items-center gap-1.5 rounded-xl border border-[var(--line)] p-3 text-center hover:bg-[var(--bg)]">
              <IconBadge icon={l.icon} variant="soft" size="lg" className="mr-0" />
              <span className="text-xs font-bold">{l.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {myAlerts.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
            <IconBadge icon="🚨" variant="soft" />
            ความเสี่ยงของคุณ ({myAlerts.length})
          </h2>
          <div className="space-y-2">
            {myAlerts.map((a, idx) => (
              <div key={idx} className={`rounded-xl border-l-4 p-3 ${a.severity === "red" ? "border-red-500 bg-red-50" : "border-amber-400 bg-amber-50"}`}>
                <div className="text-sm font-extrabold">
                  {a.severity === "red" ? "🔴" : "🟡"} {a.title}
                </div>
                <div className="mt-1 text-xs">{a.detail}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {reportRows.length > 0 && (
        <Card>
          <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
            <IconBadge icon="🧑‍🤝‍🧑" variant="navy" />
            ทีมของฉัน ({reportRows.length} คน)
          </h2>
          <div className="space-y-2">
            {reportRows.map(({ member: r, actualNBC: rNbc }) => (
              <Link key={r.id} href={`/dashboard?memberId=${r.id}&month=${month}&year=${year}`} className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-2 hover:bg-[var(--bg)]">
                <Avatar name={r.name} photo={r.photo} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{r.name}</div>
                  <div className="text-xs text-[var(--muted)]">{ROLE_LABEL[r.role]}</div>
                </div>
                <div className="text-sm font-extrabold text-[var(--navy)]">{fmt(rNbc)} NBC</div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ label, target, actual }: { label: string; target: number; actual: number }) {
  const pct = target > 0 ? Math.round((actual / target) * 100) : null;
  return (
    <Card>
      <div className="text-xs font-bold uppercase text-[var(--muted)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-[var(--navy)]">{fmt(actual)}</span>
        <span className="text-xs text-[var(--muted)]">/ เป้า {fmt(target)}</span>
      </div>
      {pct !== null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
          <div className="h-full rounded-full bg-[var(--orange)]" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
      <div className="mt-1 text-xs font-bold text-[var(--muted)]">{pct !== null ? `${pct}% ของเป้า` : "ยังไม่ได้ตั้งเป้า"}</div>
    </Card>
  );
}
