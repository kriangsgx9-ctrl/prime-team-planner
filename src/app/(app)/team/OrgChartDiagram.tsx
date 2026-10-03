import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export interface OrgChartMember {
  id: string;
  name: string;
  role: string;
  parentId: string | null;
  photo: string | null;
}

function countDescendants(id: string, byParent: Map<string, OrgChartMember[]>): number {
  const kids = byParent.get(id) ?? [];
  return kids.reduce((sum, k) => sum + 1 + countDescendants(k.id, byParent), 0);
}

function Node({ member, byParent, roleLabel }: { member: OrgChartMember; byParent: Map<string, OrgChartMember[]>; roleLabel: Record<string, string> }) {
  const kids = byParent.get(member.id) ?? [];
  const descendantCount = countDescendants(member.id, byParent);
  return (
    <li>
      <Link href={`/dashboard?memberId=${member.id}`} className="org-chart-node">
        <Avatar name={member.name} photo={member.photo} size={36} />
        <span className="org-chart-name">{member.name}</span>
        <span className="org-chart-role">{roleLabel[member.role] ?? member.role}</span>
        {descendantCount > 0 && <span className="org-chart-count">{descendantCount} คนใต้สังกัด</span>}
      </Link>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Node key={k.id} member={k} byParent={byParent} roleLabel={roleLabel} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChartDiagram({ members, roleLabel }: { members: OrgChartMember[]; roleLabel: Record<string, string> }) {
  const byParent = new Map<string, OrgChartMember[]>();
  for (const m of members) {
    if (!m.parentId) continue;
    const list = byParent.get(m.parentId) ?? [];
    list.push(m);
    byParent.set(m.parentId, list);
  }
  const roots = members.filter((m) => !m.parentId || !members.some((x) => x.id === m.parentId));

  if (!roots.length) return <div className="text-center text-sm text-[var(--muted)]">ยังไม่มีสมาชิก</div>;

  return (
    <div className="org-chart-scroll">
      <ul className="org-chart-diagram">
        {roots.map((r) => (
          <Node key={r.id} member={r} byParent={byParent} roleLabel={roleLabel} />
        ))}
      </ul>
    </div>
  );
}
