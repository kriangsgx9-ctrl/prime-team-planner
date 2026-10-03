import "server-only";
import { prisma } from "@/lib/prisma";
import { buildIncomeContext, type ActualInput, type GoalInput, type IncomeContext, type MemberLite, type OrgRole, type SettingsData } from "@/lib/domain/income";
import { defaultSettingsData } from "@/lib/domain/default-settings";

export async function getSettingsData(): Promise<SettingsData> {
  const row = await prisma.settings.findUnique({ where: { id: 1 } });
  return (row?.dataJson as unknown as SettingsData) ?? defaultSettingsData;
}

// Loads `yearsBack + 1` calendar years ending at `year` — enough to cover the
// rolling 12-month FYC lookback and the RA payout-window check (which can
// reach back across a year boundary), and widened by callers like Trends'
// "last 4 years" view that need more history in one context.
export async function loadIncomeContext(year: number, yearsBack = 1): Promise<IncomeContext> {
  const yearList = Array.from({ length: yearsBack + 1 }, (_, i) => year - yearsBack + i);
  const [members, actuals, goals, settings] = await Promise.all([
    prisma.member.findMany({
      select: { id: true, role: true, parentId: true, recruiterId: true, joinMonth: true, joinYear: true },
    }),
    prisma.actual.findMany({
      where: { year: { in: yearList } },
    }),
    prisma.goal.findMany({
      where: { year: { in: yearList } },
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
    agentStatus: a.agentStatus,
    personalUnitNBC: a.personalUnitNBC ?? 0,
    newALPromotions: a.newALPromotions,
    newVPPromotions: a.newVPPromotions,
  }));

  const goalInputs: Array<{ memberId: string; year: number; month: number } & GoalInput> = goals.map((g) => ({
    memberId: g.memberId,
    year: g.year,
    month: g.month,
    targetFYP: g.targetFYP,
    targetNBC: g.targetNBC,
    targetFYC: g.targetFYC,
  }));

  return buildIncomeContext(memberLites, actualInputs, settings, goalInputs);
}
