"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { startSession } from "@/lib/auth/session";
import { defaultSettingsData } from "@/lib/domain/default-settings";

export type FormState = { error?: string } | undefined;

const setupSchema = z.object({
  setupKey: z.string().min(1, "กรุณากรอกรหัสตั้งค่า"),
  name: z.string().trim().min(2, "กรุณากรอกชื่อ").max(60),
  username: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร")
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "ใช้ได้เฉพาะตัวอักษร A-Z ตัวเลข และ _"),
  password: z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร").max(100),
});

export async function setupAdminAction(_prev: FormState, form: FormData): Promise<FormState> {
  const allowed = process.env.SETUP_KEY?.trim();
  if (!allowed) return { error: "ยังไม่ได้ตั้งค่า SETUP_KEY บนเซิร์ฟเวอร์" };

  const parsed = setupSchema.safeParse({
    setupKey: form.get("setupKey"),
    name: form.get("name"),
    username: form.get("username"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.setupKey !== allowed) return { error: "รหัสตั้งค่าไม่ถูกต้อง" };

  if (await prisma.member.count({ where: { isAdmin: true } })) {
    return { error: "ระบบตั้งค่าแอดมินไปแล้ว — กรุณาเข้าสู่ระบบ" };
  }
  if (await prisma.member.findUnique({ where: { username: parsed.data.username } })) {
    return { error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" };
  }

  const admin = await prisma.member.create({
    data: {
      name: parsed.data.name,
      role: "AGP",
      username: parsed.data.username,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      isAdmin: true,
    },
  });

  // Default commission settings must exist before /income can calculate anything.
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, dataJson: defaultSettingsData as never },
  });

  await startSession(admin.id);
  redirect("/team");
}
