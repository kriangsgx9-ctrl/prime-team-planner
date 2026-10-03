"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionAdmin, actionUser } from "@/lib/auth/session";
import { ORG_ROLES } from "@/lib/domain/org";

export type FormState = { error?: string; ok?: boolean } | undefined;

// Self + every descendant are invalid new parents — either would create a
// cycle in the org tree (infinite loop in every tree-walking query built on
// `parentId`). Mirrors the descendants()-based guard added to the offline
// HTML app's Team page.
async function descendantIds(memberId: string): Promise<Set<string>> {
  const all = await prisma.member.findMany({ select: { id: true, parentId: true } });
  const childrenByParent = new Map<string, string[]>();
  for (const m of all) {
    if (!m.parentId) continue;
    const list = childrenByParent.get(m.parentId) ?? [];
    list.push(m.id);
    childrenByParent.set(m.parentId, list);
  }
  const out = new Set<string>();
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

const roleEnum = z.enum(ORG_ROLES as [string, ...string[]]);

const memberSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อ").max(100),
  role: roleEnum,
  parentId: z.string().optional(),
  recruiterId: z.string().optional(),
  agentCode: z.string().trim().max(40).optional(),
  joinMonth: z.coerce.number().int().min(1).max(12).optional(),
  joinYearBE: z.coerce.number().int().optional(),
});

export async function addMemberAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionUser();
  const parsed = memberSchema.safeParse({
    name: form.get("name"),
    role: form.get("role"),
    parentId: form.get("parentId") || undefined,
    recruiterId: form.get("recruiterId") || undefined,
    agentCode: form.get("agentCode") || undefined,
    joinMonth: form.get("joinMonth") || undefined,
    joinYearBE: form.get("joinYearBE") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await prisma.member.create({
    data: {
      name: d.name,
      role: d.role as never,
      parentId: d.parentId || null,
      recruiterId: d.recruiterId || null,
      agentCode: d.agentCode || null,
      joinMonth: d.joinMonth ?? null,
      joinYear: d.joinMonth && d.joinYearBE ? d.joinYearBE - 543 : null,
    },
  });
  revalidatePath("/team");
  return { ok: true };
}

export async function updateMemberAction(memberId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await actionUser();
  const parsed = memberSchema.safeParse({
    name: form.get("name"),
    role: form.get("role"),
    parentId: form.get("parentId") || undefined,
    recruiterId: form.get("recruiterId") || undefined,
    agentCode: form.get("agentCode") || undefined,
    joinMonth: form.get("joinMonth") || undefined,
    joinYearBE: form.get("joinYearBE") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.parentId) {
    if (d.parentId === memberId) return { error: "ไม่สามารถตั้งตัวเองเป็นหัวหน้าได้" };
    const invalid = await descendantIds(memberId);
    if (invalid.has(d.parentId)) return { error: "ไม่สามารถเลือกลูกทีมของตัวเองเป็นหัวหน้าได้ (จะทำให้โครงสร้างวนลูป)" };
  }

  await prisma.member.update({
    where: { id: memberId },
    data: {
      name: d.name,
      role: d.role as never,
      parentId: d.parentId || null,
      recruiterId: d.recruiterId || null,
      agentCode: d.agentCode || null,
      joinMonth: d.joinMonth ?? null,
      joinYear: d.joinMonth && d.joinYearBE ? d.joinYearBE - 543 : null,
    },
  });
  revalidatePath("/team");
  return { ok: true };
}

export async function setPhotoAction(memberId: string, photo: string | null): Promise<FormState> {
  await actionUser();
  if (photo !== null && (photo.length > 200_000 || !/^data:image\/(jpeg|png|webp);base64,/.test(photo))) {
    return { error: "ไฟล์รูปไม่ถูกต้องหรือใหญ่เกินไป" };
  }
  await prisma.member.update({ where: { id: memberId }, data: { photo } });
  revalidatePath("/team");
  return { ok: true };
}

export async function deleteMemberAction(memberId: string): Promise<FormState> {
  await actionUser();
  const total = await prisma.member.count();
  if (total <= 1) return { error: "ต้องมีสมาชิกอย่างน้อย 1 คนในระบบ" };
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  // Re-parent this member's own reports to its own parent, like the offline app does.
  await prisma.member.updateMany({ where: { parentId: memberId }, data: { parentId: member?.parentId ?? null } });
  await prisma.member.updateMany({ where: { recruiterId: memberId }, data: { recruiterId: null } });
  await prisma.member.delete({ where: { id: memberId } });
  revalidatePath("/team");
  return { ok: true };
}

const grantLoginSchema = z.object({
  username: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร")
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "ใช้ได้เฉพาะตัวอักษร A-Z ตัวเลข และ _"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร").max(100),
  isAdmin: z.boolean(),
});

/** Grants (or re-issues) login access to an existing member — admin-only, mirrors
 * how License Quest's admin issues shared PRIME01-style accounts to the team. */
export async function grantLoginAction(memberId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await actionAdmin();
  const parsed = grantLoginSchema.safeParse({
    username: form.get("username"),
    password: form.get("password"),
    isAdmin: form.get("isAdmin") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existing = await prisma.member.findUnique({ where: { username: parsed.data.username } });
  if (existing && existing.id !== memberId) return { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };

  await prisma.member.update({
    where: { id: memberId },
    data: {
      username: parsed.data.username,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      isAdmin: parsed.data.isAdmin,
      sessionId: null, // force re-login with the new credentials
    },
  });
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeLoginAction(memberId: string): Promise<FormState> {
  const me = await actionAdmin();
  if (me.id === memberId) return { error: "ถอดสิทธิ์ล็อกอินของตัวเองไม่ได้" };
  await prisma.member.update({ where: { id: memberId }, data: { username: null, passwordHash: null, isAdmin: false, sessionId: null } });
  revalidatePath("/team");
  return { ok: true };
}
