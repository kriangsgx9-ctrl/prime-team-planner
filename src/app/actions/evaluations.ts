"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { actionUser } from "@/lib/auth/session";
import { getEvalCategories } from "@/lib/domain/evaluations";
import type { OrgRole } from "@/lib/domain/income";

export type FormState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  memberId: z.string().min(1),
  year: z.coerce.number().int(),
  quarter: z.coerce.number().int().min(1).max(4),
  role: z.string(),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
  developmentPlan: z.string().max(2000).optional(),
  followUpStatus: z.string().max(100).optional(),
});

export async function setEvaluationAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionUser();
  const parsed = schema.safeParse({
    memberId: form.get("memberId"),
    year: form.get("year"),
    quarter: form.get("quarter"),
    role: form.get("role"),
    strengths: form.get("strengths") || undefined,
    improvements: form.get("improvements") || undefined,
    developmentPlan: form.get("developmentPlan") || undefined,
    followUpStatus: form.get("followUpStatus") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const categories = getEvalCategories(d.role as OrgRole);
  const scores: Record<string, number> = {};
  for (const cat of categories) {
    const v = Number(form.get(`score_${cat.key}`) || 0);
    if (v >= 1 && v <= 5) scores[cat.key] = v;
  }

  const data = {
    scores,
    strengths: d.strengths || null,
    improvements: d.improvements || null,
    developmentPlan: d.developmentPlan || null,
    followUpStatus: d.followUpStatus || null,
    evaluatedAt: new Date(),
  };

  await prisma.evaluation.upsert({
    where: { memberId_year_quarter: { memberId: d.memberId, year: d.year, quarter: d.quarter } },
    update: data,
    create: { memberId: d.memberId, year: d.year, quarter: d.quarter, ...data },
  });
  revalidatePath("/eval");
  return { ok: true };
}
