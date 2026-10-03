"use client";

import { useActionState, useState } from "react";
import { updateMemberAction, deleteMemberAction, setPhotoAction, grantLoginAction, revokeLoginAction } from "@/app/actions/team";
import { ORG_ROLES } from "@/lib/domain/org";
import { Avatar } from "@/components/ui/Avatar";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";
import { resizeImageFile } from "@/lib/avatar";
import { invalidParentIds, type MemberNode } from "./org-tree-utils";

export interface MemberData extends MemberNode {
  recruiterId: string | null;
  agentCode: string | null;
  joinMonth: number | null;
  joinYear: number | null;
  photo: string | null;
  username: string | null;
  isAdmin: boolean;
}

export function MemberRow({
  member,
  allMembers,
  isAdmin,
  currentMemberId,
  roleLabel,
}: {
  member: MemberData;
  allMembers: MemberData[];
  isAdmin: boolean;
  currentMemberId: string;
  roleLabel: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateMemberAction.bind(null, member.id);
  const [state, action, pending] = useActionState(boundUpdate, undefined);
  const [photo, setPhoto] = useState(member.photo);
  const [photoBusy, setPhotoBusy] = useState(false);

  const excluded = invalidParentIds(member.id, allMembers);
  const parentOptions = allMembers.filter((m) => !excluded.has(m.id));
  const parent = allMembers.find((m) => m.id === member.parentId);
  const recruiter = allMembers.find((m) => m.id === member.recruiterId);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} photo={member.photo} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">
            {member.name} {member.agentCode && <span className="font-normal text-[var(--muted)]">[{member.agentCode}]</span>}
            {member.username && <span className="ml-2 rounded-full bg-[var(--orange-soft)] px-2 py-0.5 text-xs font-bold text-[var(--orange-cta)]">{member.isAdmin ? "ADMIN" : "LOGIN"}</span>}
          </div>
          <div className="truncate text-xs text-[var(--muted)]">
            {roleLabel[member.role]}
            {parent && ` · ใต้สังกัด ${parent.name}`}
            {recruiter && ` · ผู้ชักชวน: ${recruiter.name}`}
          </div>
        </div>
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-[var(--navy)] px-3 py-1.5 text-xs font-bold text-[var(--navy)]">
          {editing ? "ปิด" : "แก้ไข"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`ลบ ${member.name} และข้อมูลที่เกี่ยวข้อง?`)) deleteMemberAction(member.id);
          }}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600"
        >
          ลบ
        </button>
      </div>

      {editing && (
        <div className="mt-4 border-t border-dashed border-[var(--line)] pt-4">
        <form action={action} className="space-y-3">
          <Field label="รูปโปรไฟล์">
            <div className="flex items-center gap-3">
              <Avatar name={member.name} photo={photo} size={48} />
              <input
                type="file"
                accept="image/*"
                disabled={photoBusy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoBusy(true);
                  try {
                    const dataUrl = await resizeImageFile(file);
                    setPhoto(dataUrl);
                    await setPhotoAction(member.id, dataUrl);
                  } finally {
                    setPhotoBusy(false);
                  }
                }}
              />
              {photo && (
                <button
                  type="button"
                  className="text-xs font-bold text-red-600"
                  onClick={async () => {
                    setPhoto(null);
                    await setPhotoAction(member.id, null);
                  }}
                >
                  ลบรูป
                </button>
              )}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อ">
              <input name="name" defaultValue={member.name} required className={inputClass} />
            </Field>
            <Field label="รหัสตัวแทน">
              <input name="agentCode" defaultValue={member.agentCode ?? ""} className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ตำแหน่ง">
              <select name="role" defaultValue={member.role} className={inputClass}>
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="หัวหน้าสายงาน (Parent)" hint="ย้ายคนนี้ไปอยู่ใต้สังกัดคนอื่น — ลูกทีมเดิมจะยังอยู่ใต้สังกัดคนนี้เหมือนเดิม">
              <select name="parentId" defaultValue={member.parentId ?? ""} className={inputClass}>
                <option value="">— ไม่มี (สูงสุดในสาย) —</option>
                {parentOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({roleLabel[m.role]})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="เดือนที่บรรจุ">
              <select name="joinMonth" defaultValue={member.joinMonth ?? ""} className={inputClass}>
                <option value="">— ไม่ระบุ —</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    เดือน {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ปีที่บรรจุ (พ.ศ.)">
              <input name="joinYearBE" type="number" defaultValue={member.joinYear ? member.joinYear + 543 : ""} className={inputClass} />
            </Field>
          </div>
          <Field label="ผู้ชักชวน (สำหรับคำนวณ RA)">
            <select name="recruiterId" defaultValue={member.recruiterId ?? ""} className={inputClass}>
              <option value="">— ไม่ระบุ —</option>
              {allMembers
                .filter((m) => m.id !== member.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({roleLabel[m.role]})
                  </option>
                ))}
            </select>
          </Field>
          <FormError error={state?.error} />
          <PrimeButton type="submit" disabled={pending}>
            {pending ? "กำลังบันทึก…" : "บันทึก"}
          </PrimeButton>
        </form>
        {isAdmin && <LoginAccessPanel member={member} currentMemberId={currentMemberId} />}
        </div>
      )}
    </div>
  );
}

function LoginAccessPanel({ member, currentMemberId }: { member: MemberData; currentMemberId: string }) {
  const bound = grantLoginAction.bind(null, member.id);
  const [state, action, pending] = useActionState(bound, undefined);
  return (
    <div className="mt-4 rounded-xl bg-[var(--bg)] p-3">
      <h3 className="text-sm font-extrabold text-[var(--navy)]">สิทธิ์เข้าสู่ระบบ (แอดมินเท่านั้น)</h3>
      {member.username ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted)]">
            ชื่อผู้ใช้ปัจจุบัน: <b>{member.username}</b> {member.isAdmin && "· เป็นแอดมิน"}
          </p>
          {member.id !== currentMemberId && (
            <button
              type="button"
              className="rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-600"
              onClick={() => confirm(`ถอดสิทธิ์ล็อกอินของ ${member.name}?`) && revokeLoginAction(member.id)}
            >
              ถอดสิทธิ์
            </button>
          )}
        </div>
      ) : (
        <p className="mt-1 text-xs text-[var(--muted)]">คนนี้ยังไม่มีบัญชีล็อกอิน</p>
      )}
      <form action={action}>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input name="username" placeholder="Username ใหม่" className={inputClass} />
          <input name="password" type="password" placeholder="รหัสผ่านใหม่" className={inputClass} />
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" name="isAdmin" defaultChecked={member.isAdmin} /> ให้สิทธิ์แอดมิน
          </label>
        </div>
        <FormError error={state?.error} />
        <PrimeButton type="submit" variant="navy" disabled={pending} className="mt-2">
          {pending ? "กำลังบันทึก…" : member.username ? "ตั้งรหัสผ่านใหม่ / อัปเดตสิทธิ์" : "ออกบัญชีล็อกอิน"}
        </PrimeButton>
      </form>
    </div>
  );
}
