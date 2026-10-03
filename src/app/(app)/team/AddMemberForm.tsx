"use client";

import { useActionState } from "react";
import { addMemberAction } from "@/app/actions/team";
import { ORG_ROLES } from "@/lib/domain/org";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";
import type { MemberNode } from "./org-tree-utils";

export function AddMemberForm({ allMembers, roleLabel }: { allMembers: MemberNode[]; roleLabel: Record<string, string> }) {
  const [state, action, pending] = useActionState(addMemberAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ชื่อ">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="รหัสตัวแทน">
          <input name="agentCode" className={inputClass} placeholder="เช่น A12345" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ตำแหน่ง">
          <select name="role" className={inputClass} defaultValue="AG">
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel[r]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="หัวหน้าสังกัด (Parent)">
          <select name="parentId" className={inputClass} defaultValue="">
            <option value="">— ไม่มี (สูงสุด) —</option>
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({roleLabel[m.role]})
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="เดือนที่บรรจุ">
          <select name="joinMonth" className={inputClass} defaultValue="">
            <option value="">— ไม่ระบุ —</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                เดือน {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ปีที่บรรจุ (พ.ศ.)">
          <input name="joinYearBE" type="number" className={inputClass} />
        </Field>
      </div>
      <Field label="ผู้ชักชวน (สำหรับคำนวณ RA — เว้นว่างได้)">
        <select name="recruiterId" className={inputClass} defaultValue="">
          <option value="">— ไม่ระบุ —</option>
          {allMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({roleLabel[m.role]})
            </option>
          ))}
        </select>
      </Field>
      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังเพิ่ม…" : "เพิ่มสมาชิก"}
      </PrimeButton>
    </form>
  );
}
