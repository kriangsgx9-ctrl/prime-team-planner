"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { actionAdmin } from "@/lib/auth/session";
import { getSettingsData } from "@/lib/services/income-context";
import type { SettingsData, Tier } from "@/lib/domain/income";
import { ORG_ROLES } from "@/lib/domain/org";

export type FormState = { error?: string; ok?: boolean } | undefined;

const TIER_KEYS = [
  "persistencyModifierTiers",
  "renewalBonusModifierTiers",
  "qbTiers",
  "abTiers",
  "alOverridingTiers",
  "alQBTiers",
  "alABTiers",
  "vpOverridingTiers",
  "vpQBTiers",
  "vpABTiers",
  "agpOverridingTiers",
  "agpQBTiers",
  "agpABTiers",
] as const satisfies readonly (keyof SettingsData)[];

const SCALAR_KEYS = [
  "odiChildRateAL",
  "odiGrandchildRateAL",
  "roRateAL",
  "odiChildRateVP",
  "odiGrandchildRateVP",
  "roRateVP",
  "odiChildRateAGP",
  "roRateAGP",
  "structureExtBonusAmount",
  "raThreshold",
  "raRate",
  "raMonths",
  "raNewAgentNBCThreshold",
] as const satisfies readonly (keyof SettingsData)[];

function num(form: FormData, key: string, fallback: number): number {
  const v = form.get(key);
  if (v === null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function updateSettingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  await actionAdmin();
  const current = await getSettingsData();
  const next: SettingsData = structuredClone(current);

  for (const key of TIER_KEYS) {
    const tiers = current[key] as Tier[];
    next[key] = tiers.map((t, i) => ({
      min: num(form, `tier_${key}_${i}_min`, t.min),
      rate: num(form, `tier_${key}_${i}_rate`, t.rate) / 100,
    })) as never;
  }

  for (const key of SCALAR_KEYS) {
    const isRate = key.startsWith("odi") || key.startsWith("ro") || key === "raRate";
    const raw = current[key] as number;
    const formVal = num(form, key, isRate ? raw * 100 : raw);
    next[key] = (isRate ? formVal / 100 : formVal) as never;
  }

  const retention: SettingsData["retentionCriteria"] = {};
  for (const role of ORG_ROLES) {
    if (role === "AG") continue;
    const c = current.retentionCriteria[role];
    if (!c) continue;
    retention[role] = {
      fyc: num(form, `retention_${role}_fyc`, c.fyc),
      agents: num(form, `retention_${role}_agents`, c.agents),
      persistency: num(form, `retention_${role}_persistency`, c.persistency * 100) / 100,
    };
  }
  next.retentionCriteria = retention;

  await prisma.settings.upsert({ where: { id: 1 }, update: { dataJson: next as never }, create: { id: 1, dataJson: next as never } });
  revalidatePath("/settings");
  revalidatePath("/income");
  return { ok: true };
}
