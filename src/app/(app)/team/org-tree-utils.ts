export interface MemberNode {
  id: string;
  name: string;
  role: string;
  parentId: string | null;
}

/** Self + every descendant — invalid choices for this member's new parent
 * (picking either would create a cycle). Mirrors the server-side guard in
 * app/actions/team.ts's descendantIds(). */
export function invalidParentIds(memberId: string, allMembers: MemberNode[]): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const m of allMembers) {
    if (!m.parentId) continue;
    const list = childrenByParent.get(m.parentId) ?? [];
    list.push(m.id);
    childrenByParent.set(m.parentId, list);
  }
  const out = new Set<string>([memberId]);
  const walk = (id: string) => {
    for (const childId of childrenByParent.get(id) ?? []) {
      if (!out.has(childId)) {
        out.add(childId);
        walk(childId);
      }
    }
  };
  walk(memberId);
  return out;
}
