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
  actualFYP: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  actualNBC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  actualFYC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  actualRYC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  priorYearNBC: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
  persistency: z.coerce.number().min(0, "ต้องอยู่ระหว่าง 0-100%").max(100, "ต้องอยู่ระหว่าง 0-100%"),
  agentStatus: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]),
  newALPromotions: z.coerce.number().int().min(0),
  newVPPromotions: z.coerce.number().int().min(0),
});

export async function setActualAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionUser();
  const parsed = schema.safeParse({
    memberId: form.get("memberId"),
    year: form.get("year"),
    month: form.get("month"),
    actualFYP: form.get("actualFYP") || 0,
    actualNBC: form.get("actualNBC") || 0,
    actualFYC: form.get("actualFYC") || 0,
    actualRYC: form.get("actualRYC") || 0,
    priorYearNBC: form.get("priorYearNBC") || 0,
    persistency: form.get("persistency") || 0,
    agentStatus: form.get("agentStatus") || "ACTIVE",
    newALPromotions: form.get("newALPromotions") || 0,
    newVPPromotions: form.get("newVPPromotions") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const data = {
    actualFYP: d.actualFYP,
    actualNBC: d.actualNBC,
    actualFYC: d.actualFYC,
    actualRYC: d.actualRYC,
    priorYearNBC: d.priorYearNBC,
    persistency: d.persistency / 100,
    active: d.agentStatus === "ACTIVE",
    agentStatus: d.agentStatus,
    newALPromotions: d.newALPromotions,
    newVPPromotions: d.newVPPromotions,
  };

  await prisma.actual.upsert({
    where: { memberId_year_month: { memberId: d.memberId, year: d.year, month: d.month } },
    update: data,
    create: { memberId: d.memberId, year: d.year, month: d.month, ...data },
  });
  revalidatePath("/actuals");
  revalidatePath("/income");
  return { ok: true };
}
