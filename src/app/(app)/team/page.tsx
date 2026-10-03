import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { Card } from "@/components/ui/primitives";
import { AddMemberForm } from "./AddMemberForm";
import { MemberRow, type MemberData } from "./MemberRow";

export default async function TeamPage() {
  const me = await requireUser();
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
        <h1 className="text-lg font-extrabold text-[var(--navy)]">สมาชิกทั้งหมด ({list.length})</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">จัดการสายงาน ย้ายหัวหน้าสังกัด และออกบัญชีล็อกอินให้ผู้จัดการ</p>
      </Card>

      <div className="space-y-3">
        {sorted.map((m) => (
          <MemberRow key={m.id} member={m} allMembers={list} isAdmin={me.isAdmin} currentMemberId={me.id} roleLabel={ROLE_LABEL} />
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-base font-extrabold text-[var(--navy)]">เพิ่มสมาชิกใหม่</h2>
        <AddMemberForm allMembers={list} roleLabel={ROLE_LABEL} />
      </Card>
    </div>
  );
}
