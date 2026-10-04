import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { loadIncomeContext } from "@/lib/services/income-context";
import { computeIncome, fmt } from "@/lib/domain/income";
import { Card, IconBadge } from "@/components/ui/primitives";
import { PeriodPicker } from "@/components/PeriodPicker";

export default async function IncomePage({ searchParams }: { searchParams: Promise<{ memberId?: string; year?: string; month?: string }> }) {
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

  const ctx = await loadIncomeContext(year);
  const income = computeIncome(ctx, member.id, year, month);
  const moneyItems = income.items.filter((i) => !i.isBase);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-3 flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="💰" variant="orange" />
          ประมาณการรายได้
        </h1>
        <PeriodPicker members={sorted} roleLabel={ROLE_LABEL} memberId={member.id} year={year} month={month} action="/income" />
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center text-base font-extrabold">
          <IconBadge icon="🧮" variant="orange" />
          รายละเอียดรายได้ประมาณการ — {member.name}
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          ตำแหน่ง: {ROLE_LABEL[member.role]} · เดือน {month}/{year + 543}
        </p>
        <div className="divide-y divide-[var(--line)]">
          {income.items.map((i, idx) => (
            <div key={idx} className="flex items-baseline justify-between gap-3 py-2">
              <span className={i.isBase ? "text-sm font-semibold text-[var(--muted)]" : "text-sm font-semibold"}>{i.label}</span>
              <span className={i.isBase ? "text-sm font-bold text-[var(--muted)]" : "text-sm font-extrabold text-[var(--navy)]"}>
                {i.isBase ? fmt(i.value) : `฿ ${fmt(i.value)}`}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-[var(--orange-soft)] p-3">
          <div className="text-xs font-bold text-[var(--muted)]">รวมรายได้ประมาณการ</div>
          <div className="text-xl font-extrabold text-[var(--orange-cta)]">฿ {fmt(income.total)}</div>
        </div>
      </Card>

      {moneyItems.some((i) => i.nextTier?.hasNext) && (
        <Card>
          <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
            <IconBadge icon="🪜" variant="soft" />
            วางแผนขั้นโบนัสถัดไป
          </h2>
          <p className="mb-3 text-xs text-[var(--muted)]">อีกเท่าไหร่ถึงจะขยับเทียร์ % ให้สูงขึ้นในแต่ละประเภท</p>
          <div className="space-y-2">
            {moneyItems
              .filter((i) => i.nextTier?.hasNext)
              .map((i, idx) => (
                <div key={idx} className="rounded-xl bg-[var(--bg)] p-3">
                  <div className="text-sm font-bold">{i.label.split("(")[0].trim()}</div>
                  <div className="text-xs text-[var(--muted)]">
                    เหลืออีก <b className="text-[var(--navy)]">{fmt(i.nextTier!.remaining ?? 0)}</b> ถึงเทียร์ถัดไป — จะได้{" "}
                    <b className="text-green-700">{((i.nextTier!.nextRate ?? 0) * 100).toFixed(2)}%</b> (จากปัจจุบัน {((i.nextTier!.currentRate ?? 0) * 100).toFixed(2)}%)
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
