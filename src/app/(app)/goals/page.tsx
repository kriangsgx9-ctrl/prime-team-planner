import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { Card, IconBadge } from "@/components/ui/primitives";
import { PeriodPicker } from "@/components/PeriodPicker";
import { GoalForm } from "./GoalForm";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ memberId?: string; year?: string; month?: string }> }) {
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

  const goal = await prisma.goal.findUnique({ where: { memberId_year_month: { memberId: member.id, year, month } } });

  return (
    <div className="space-y-4">
      <Card bgImage="/images/hero/target.jpg">
        <h1 className="mb-3 flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="🎯" variant="navy" />
          กำหนดเป้าหมาย
        </h1>
        <PeriodPicker members={sorted} roleLabel={ROLE_LABEL} memberId={member.id} year={year} month={month} action="/goals" />
      </Card>
      <Card>
        <h2 className="mb-3 text-base font-extrabold">
          เป้าหมาย {month}/{year + 543} — {member.name}
        </h2>
        <GoalForm memberId={member.id} year={year} month={month} goal={goal} />
      </Card>
    </div>
  );
}
