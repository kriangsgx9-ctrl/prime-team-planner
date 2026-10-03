"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionAdmin } from "@/lib/auth/session";

export type FormState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  icon: z.string().trim().min(1).max(8),
  name: z.string().trim().min(1, "กรุณาระบุชื่อคุณวุฒิ").max(100),
  scope: z.enum(["ALL", "AG", "AL", "VP"]),
  metric: z.string().min(1),
  threshold: z.coerce.number(),
  periodStartMonth: z.coerce.number().int().min(1).max(12).optional(),
});

export async function addQualificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionAdmin();
  const metric = String(form.get("metric"));
  const isPct = metric.includes("Pct") || metric === "persistency";
  const rawThreshold = Number(form.get("threshold") || 0);
  const parsed = schema.safeParse({
    icon: form.get("icon") || "🏅",
    name: form.get("name"),
    scope: form.get("scope") || "ALL",
    metric,
    threshold: isPct ? rawThreshold / 100 : rawThreshold,
    periodStartMonth: form.get("periodStartMonth") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await prisma.qualification.create({
    data: { icon: d.icon, name: d.name, scope: d.scope, metric: d.metric, threshold: d.threshold, periodStartMonth: d.periodStartMonth ?? null },
  });
  revalidatePath("/qualtrack");
  return { ok: true };
}

export async function deleteQualificationAction(id: string): Promise<FormState> {
  await actionAdmin();
  await prisma.qualification.delete({ where: { id } });
  revalidatePath("/qualtrack");
  return { ok: true };
}
