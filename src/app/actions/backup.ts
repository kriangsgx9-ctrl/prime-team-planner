"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { actionAdmin } from "@/lib/auth/session";

type BackupMember = {
  id: string;
  name: string;
  role: string;
  parentId: string | null;
  recruiterId: string | null;
  agentCode: string | null;
  joinMonth: number | null;
  joinYear: number | null;
  photo: string | null;
  username: string | null;
  passwordHash: string | null;
  isAdmin: boolean;
  isActive: boolean;
};

type BackupData = {
  _meta?: { app?: string; exportedAt?: string };
  members: BackupMember[];
  goals: Array<{ id: string; memberId: string; year: number; month: number; targetFYP: number; targetNBC: number; targetFYC: number; status: string | null; approvedAt: string | null }>;
  actuals: Array<{
    id: string;
    memberId: string;
    year: number;
    month: number;
    actualFYP: number;
    actualNBC: number;
    actualFYC: number;
    actualRYC: number;
    priorYearNBC: number;
    persistency: number;
    active: boolean;
    agentStatus: string | null;
    personalUnitNBC: number | null;
    newALPromotions: number;
    newVPPromotions: number;
  }>;
  evaluations?: Array<{
    id: string;
    memberId: string;
    year: number;
    quarter: number;
    scores: unknown;
    strengths: string | null;
    improvements: string | null;
    developmentPlan: string | null;
    followUpStatus: string | null;
    evaluatedAt: string | null;
  }>;
  qualifications?: Array<{ id: string; icon: string; name: string; scope: string; metric: string; threshold: number; periodStartMonth: number | null }>;
  settings?: { dataJson: unknown } | null;
};

export type BackupPreview = {
  memberCount: number;
  goalCount: number;
  actualCount: number;
  evaluationCount: number;
  qualificationCount: number;
  exportedAt: string | null;
};

export async function previewBackupRestore(formData: FormData): Promise<(BackupPreview & { raw: string }) | { error: string }> {
  await actionAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "ไม่พบไฟล์" };

  const raw = await file.text();
  let parsed: BackupData;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "อ่านไฟล์ไม่สำเร็จ: ไฟล์ไม่ใช่ JSON ที่ถูกต้อง" };
  }
  if (!parsed || !Array.isArray(parsed.members) || !Array.isArray(parsed.goals) || !Array.isArray(parsed.actuals)) {
    return { error: "ไฟล์นี้ไม่ใช่ไฟล์ Backup ที่ถูกต้อง (โครงสร้างข้อมูลไม่ตรง)" };
  }

  return {
    memberCount: parsed.members.length,
    goalCount: parsed.goals.length,
    actualCount: parsed.actuals.length,
    evaluationCount: parsed.evaluations?.length ?? 0,
    qualificationCount: parsed.qualifications?.length ?? 0,
    exportedAt: parsed._meta?.exportedAt ?? null,
    raw,
  };
}

// Wipes every table this app manages and recreates it from the backup file,
// preserving original ids so relations (memberId foreign keys) stay intact.
// Members are inserted in two passes — first without parentId/recruiterId,
// then patched — so self-referencing rows never hit a "parent doesn't exist
// yet" ordering problem. sessionId is deliberately NOT restored: every
// account (including whoever is running this restore) is signed out and
// must log in again, which is the safest default after a full data swap.
export async function commitBackupRestore(raw: string): Promise<{ ok: true } | { error: string }> {
  await actionAdmin();

  let data: BackupData;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "ไฟล์ข้อมูลเสียหาย กรุณาอัปโหลดใหม่" };
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.actual.deleteMany({});
      await tx.goal.deleteMany({});
      await tx.evaluation.deleteMany({});
      await tx.member.deleteMany({});
      await tx.qualification.deleteMany({});

      for (const m of data.members) {
        await tx.member.create({
          data: {
            id: m.id,
            name: m.name,
            role: m.role as never,
            agentCode: m.agentCode ?? null,
            joinMonth: m.joinMonth ?? null,
            joinYear: m.joinYear ?? null,
            photo: m.photo ?? null,
            username: m.username ?? null,
            passwordHash: m.passwordHash ?? null,
            isAdmin: m.isAdmin ?? false,
            isActive: m.isActive ?? true,
          },
        });
      }
      for (const m of data.members) {
        if (m.parentId || m.recruiterId) {
          await tx.member.update({ where: { id: m.id }, data: { parentId: m.parentId ?? null, recruiterId: m.recruiterId ?? null } });
        }
      }

      for (const g of data.goals) {
        await tx.goal.create({
          data: { id: g.id, memberId: g.memberId, year: g.year, month: g.month, targetFYP: g.targetFYP, targetNBC: g.targetNBC, targetFYC: g.targetFYC, status: g.status ?? null, approvedAt: g.approvedAt ? new Date(g.approvedAt) : null },
        });
      }
      for (const a of data.actuals) {
        await tx.actual.create({
          data: {
            id: a.id,
            memberId: a.memberId,
            year: a.year,
            month: a.month,
            actualFYP: a.actualFYP,
            actualNBC: a.actualNBC,
            actualFYC: a.actualFYC,
            actualRYC: a.actualRYC,
            priorYearNBC: a.priorYearNBC ?? 0,
            persistency: a.persistency ?? 1,
            active: a.active ?? true,
            agentStatus: a.agentStatus ?? null,
            personalUnitNBC: a.personalUnitNBC ?? null,
            newALPromotions: a.newALPromotions ?? 0,
            newVPPromotions: a.newVPPromotions ?? 0,
          },
        });
      }
      for (const e of data.evaluations ?? []) {
        await tx.evaluation.create({
          data: {
            id: e.id,
            memberId: e.memberId,
            year: e.year,
            quarter: e.quarter,
            scores: e.scores as never,
            strengths: e.strengths ?? null,
            improvements: e.improvements ?? null,
            developmentPlan: e.developmentPlan ?? null,
            followUpStatus: e.followUpStatus ?? null,
            evaluatedAt: e.evaluatedAt ? new Date(e.evaluatedAt) : null,
          },
        });
      }
      for (const q of data.qualifications ?? []) {
        await tx.qualification.create({
          data: { id: q.id, icon: q.icon, name: q.name, scope: q.scope, metric: q.metric, threshold: q.threshold, periodStartMonth: q.periodStartMonth ?? null },
        });
      }
      if (data.settings?.dataJson) {
        await tx.settings.upsert({ where: { id: 1 }, update: { dataJson: data.settings.dataJson as never }, create: { id: 1, dataJson: data.settings.dataJson as never } });
      }
    },
    { timeout: 30_000 },
  );

  revalidatePath("/", "layout");
  return { ok: true };
}
