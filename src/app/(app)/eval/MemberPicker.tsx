"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/primitives";

export function MemberPicker({ members, roleLabel, memberId, year, quarter }: { members: Array<{ id: string; name: string; role: string }>; roleLabel: Record<string, string>; memberId: string; year: number; quarter: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} method="get" action="/eval" className="mb-3">
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="quarter" value={quarter} />
      <select name="memberId" defaultValue={memberId} className={inputClass} onChange={() => formRef.current?.requestSubmit()}>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({roleLabel[m.role]})
          </option>
        ))}
      </select>
    </form>
  );
}
