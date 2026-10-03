import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { monthToQuarter, nextQuarter, prevQuarter, quarterLabel } from "@/lib/domain/evaluations";
import { Card } from "@/components/ui/primitives";
import { EvalCard } from "./EvalCard";
import { MemberPicker } from "./MemberPicker";

export default async function EvalPage({ searchParams }: { searchParams: Promise<{ memberId?: string; year?: string; quarter?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const quarter = sp.quarter ? parseInt(sp.quarter) : monthToQuarter(now.getMonth() + 1);

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));
  const memberId = sp.memberId ?? sorted[0]?.id;
  const member = sorted.find((m) => m.id === memberId) ?? sorted[0];

  if (!member) {
    return (
      <Card>
        <p>ยังไม่มีสมาชิกในระบบ</p>
      </Card>
    );
  }

  const directReports = members.filter((m) => m.parentId === member.id);
  const prev = prevQuarter(year, quarter);
  const next = nextQuarter(year, quarter);

  const evalIds = directReports.map((k) => k.id);
  const [currentEvals, historyEvals] = await Promise.all([
    prisma.evaluation.findMany({ where: { memberId: { in: evalIds }, year, quarter } }),
    prisma.evaluation.findMany({ where: { memberId: { in: evalIds } }, orderBy: [{ year: "desc" }, { quarter: "desc" }] }),
  ]);
  const currentByMember = new Map(currentEvals.map((e) => [e.memberId, e]));
  const historyByMember = new Map<string, typeof historyEvals>();
  for (const e of historyEvals) {
    if (e.year === year && e.quarter === quarter) continue; // exclude the one being edited
    const list = historyByMember.get(e.memberId) ?? [];
    if (list.length < 4) list.push(e);
    historyByMember.set(e.memberId, list);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-extrabold text-[var(--navy)]">ประเมินผลงานตัวแทน (รายไตรมาส)</h1>
        <p className="mb-3 text-sm text-[var(--muted)]">ใช้พูดคุย ติดตาม และวางแผนพัฒนา ไม่ใช่แค่ให้คะแนน</p>
        <MemberPicker members={sorted} roleLabel={ROLE_LABEL} memberId={member.id} year={year} quarter={quarter} />
        <div className="flex items-center justify-between">
          <Link href={`/eval?memberId=${member.id}&year=${prev.y}&quarter=${prev.q}`} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-bold">
            ‹ ก่อนหน้า
          </Link>
          <div className="text-sm font-extrabold text-[var(--navy)]">{quarterLabel(year, quarter)}</div>
          <Link href={`/eval?memberId=${member.id}&year=${next.y}&quarter=${next.q}`} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-bold">
            ถัดไป ›
          </Link>
        </div>
      </Card>

      {directReports.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <div className="mb-2 text-3xl">🧑‍🤝‍🧑</div>
            <p className="text-sm text-[var(--muted)]">{member.name} ไม่มีทีมใต้สังกัดโดยตรง — เลือกผู้ที่มีทีมจากช่องด้านบนเพื่อเริ่มประเมิน</p>
          </div>
        </Card>
      ) : (
        directReports
          .sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never))
          .map((k) => (
            <EvalCard
              key={`${k.id}-${year}-${quarter}`}
              member={{ id: k.id, name: k.name, role: k.role, photo: k.photo }}
              year={year}
              quarter={quarter}
              existing={currentByMember.get(k.id) ?? null}
              history={(historyByMember.get(k.id) ?? []).map((e) => ({ year: e.year, quarter: e.quarter, scores: e.scores as Record<string, number>, strengths: e.strengths, improvements: e.improvements, developmentPlan: e.developmentPlan }))}
              prevDevelopmentPlan={(() => {
                const prevEv = historyEvals.find((e) => e.memberId === k.id && e.year === prev.y && e.quarter === prev.q);
                return prevEv?.developmentPlan ?? null;
              })()}
            />
          ))
      )}
    </div>
  );
}
