"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { endSession, startSession } from "@/lib/auth/session";

export type FormState = { error?: string } | undefined;

const loginSchema = z.object({
  username: z.string().trim().toUpperCase().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const member = await prisma.member.findUnique({ where: { username: parsed.data.username } });
  // Same message for unknown account and wrong password.
  if (!member || !member.isActive || !member.passwordHash || !(await bcrypt.compare(parsed.data.password, member.passwordHash))) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }
  await startSession(member.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await endSession();
  redirect("/login");
}
