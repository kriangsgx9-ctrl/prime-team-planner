"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionUser } from "@/lib/auth/session";

export type FormState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  memberId: z.string().min(1),
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
  targetFYP: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  targetNBC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  targetFYC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
});

export async function setGoalAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionUser();
  const parsed = schema.safeParse({
    memberId: form.get("memberId"),
    year: form.get("year"),
    month: form.get("month"),
    targetFYP: form.get("targetFYP") || 0,
    targetNBC: form.get("targetNBC") || 0,
    targetFYC: form.get("targetFYC") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await prisma.goal.upsert({
    where: { memberId_year_month: { memberId: d.memberId, year: d.year, month: d.month } },
    update: { targetFYP: d.targetFYP, targetNBC: d.targetNBC, targetFYC: d.targetFYC },
    create: { memberId: d.memberId, year: d.year, month: d.month, targetFYP: d.targetFYP, targetNBC: d.targetNBC, targetFYC: d.targetFYC },
  });
  revalidatePath("/goals");
  return { ok: true };
}
