import "server-only";
import { prisma } from "@/lib/prisma";
import { buildIncomeContext, type ActualInput, type IncomeContext, type MemberLite, type OrgRole, type SettingsData } from "@/lib/domain/income";
import { defaultSettingsData } from "@/lib/domain/default-settings";

export async function getSettingsData(): Promise<SettingsData> {
  const row = await prisma.settings.findUnique({ where: { id: 1 } });
  return (row?.dataJson as unknown as SettingsData) ?? defaultSettingsData;
}

// Loads two calendar years (the target year + the previous one) of actuals —
// enough to cover the rolling 12-month FYC lookback and the RA payout-window
// check, which can both reach back across a year boundary (e.g. computing
// January needs December of the prior year).
export async function loadIncomeContext(year: number): Promise<IncomeContext> {
  const [members, actuals, settings] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, role: true, parentId: true, recruiterId: true, joinMonth: true, joinYear: true },
    }),
    prisma.actual.findMany({
      where: { year: { in: [year - 1, year] } },
    }),
    getSettingsData(),
  ]);

  const memberLites: MemberLite[] = members.map((m) => ({
    id: m.id,
    role: m.role as OrgRole,
    parentId: m.parentId,
    recruiterId: m.recruiterId,
    joinMonth: m.joinMonth,
    joinYear: m.joinYear,
  }));

  const actualInputs: Array<{ memberId: string; year: number; month: number } & ActualInput> = actuals.map((a) => ({
    memberId: a.memberId,
    year: a.year,
    month: a.month,
    actualFYP: a.actualFYP,
    actualNBC: a.actualNBC,
    actualFYC: a.actualFYC,
    actualRYC: a.actualRYC,
    priorYearNBC: a.priorYearNBC,
    persistency: a.persistency,
    active: a.active,
    personalUnitNBC: a.personalUnitNBC ?? 0,
    newALPromotions: a.newALPromotions,
    newVPPromotions: a.newVPPromotions,
  }));

  return buildIncomeContext(memberLites, actualInputs, settings);
}
