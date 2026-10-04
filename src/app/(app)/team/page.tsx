import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { Card, cn, IconBadge } from "@/components/ui/primitives";
import { AddMemberForm } from "./AddMemberForm";
import { MemberRow, type MemberData } from "./MemberRow";
import { OrgChartDiagram } from "./OrgChartDiagram";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const view = sp.view === "chart" ? "chart" : "list";
  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });

  const list: MemberData[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    parentId: m.parentId,
    recruiterId: m.recruiterId,
    agentCode: m.agentCode,
    joinMonth: m.joinMonth,
    joinYear: m.joinYear,
    photo: m.photo,
    username: m.username,
    isAdmin: m.isAdmin,
  }));
  const sorted = [...list].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="🧑‍🤝‍🧑" variant="navy" />
          สมาชิกทั้งหมด ({list.length})
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">จัดการสายงาน ย้ายหัวหน้าสังกัด และออกบัญชีล็อกอินให้ผู้จัดการ</p>
      </Card>

      <Card>
        <div className="mb-3 flex gap-2">
          <Link href="/team?view=list" className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", view === "list" ? "bg-[var(--navy)] text-white" : "border border-[var(--line)]")}>
            แบบย่อ (รายการ)
          </Link>
          <Link href="/team?view=chart" className={cn("rounded-lg px-3 py-1.5 text-sm font-bold", view === "chart" ? "bg-[var(--navy)] text-white" : "border border-[var(--line)]")}>
            แบบผังองค์กร
          </Link>
        </div>
        {view === "chart" ? <OrgChartDiagram members={list} roleLabel={ROLE_LABEL} /> : <p className="text-sm text-[var(--muted)]">รายชื่อทั้งหมดอยู่ด้านล่าง — กด &quot;แก้ไข&quot; เพื่อดูสายการบังคับบัญชาของแต่ละคน</p>}
      </Card>

      <div className="space-y-3">
        {sorted.map((m) => (
          <MemberRow key={m.id} member={m} allMembers={list} isAdmin={me.isAdmin} currentMemberId={me.id} roleLabel={ROLE_LABEL} />
        ))}
      </div>

      <Card>
        <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="➕" variant="green" />
          เพิ่มสมาชิกใหม่
        </h2>
        <AddMemberForm allMembers={list} roleLabel={ROLE_LABEL} />
      </Card>
    </div>
  );
}
