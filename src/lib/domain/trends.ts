// Ported from the HTML app's trend-analysis functions (getMonthsBack,
// getTrendValue, computeTrendInsights, computeStatusComposition,
// computeTargetAchievementComposition, getLatestKnownStatus).
import { AL_ROLES, descendants, getActual, getGoal, type IncomeContext } from "./income";

export type TrendField = "actualFYP" | "actualNBC" | "actualFYC";
export type TrendScope = "person" | "team";

export interface Period {
  y: number;
  m: number;
}

export function getMonthsBack(y: number, m: number, n: number): Period[] {
  const result: Period[] = [];
  for (let i = n - 1; i >= 0; i--) {
    let mm = m - i;
    let yy = y;
    while (mm < 1) {
      mm += 12;
      yy--;
    }
    result.push({ y: yy, m: mm });
  }
  return result;
}

// The value for one period, for either "this person" (team-inclusive if
// they're a leader) or the whole company.
export function getTrendValue(ctx: IncomeContext, scope: TrendScope, field: TrendField, y: number, m: number, selectedMemberId: string): number {
  if (scope === "team") {
    let sum = 0;
    for (const u of ctx.membersById.values()) sum += getActual(ctx, u.id, y, m)[field] || 0;
    return sum;
  }
  const u = ctx.membersById.get(selectedMemberId);
  const isLeader = u && (AL_ROLES.includes(u.role as (typeof AL_ROLES)[number]) || u.role === "VP" || u.role === "AGP");
  if (!isLeader) return getActual(ctx, selectedMemberId, y, m)[field] || 0;
  let sum = getActual(ctx, selectedMemberId, y, m)[field] || 0;
  for (const d of descendants(ctx, selectedMemberId)) sum += getActual(ctx, d.id, y, m)[field] || 0;
  return sum;
}

export interface TrendInsights {
  current: number;
  momChange: number | null;
  yoyChange: number | null;
  avg: number;
  sum: number;
  best: { value: number; period: Period };
}

export function computeTrendInsights(values: number[], periods: Period[]): TrendInsights {
  const n = values.length;
  const current = values[n - 1];
  const prevVal = n >= 2 ? values[n - 2] : null;
  const momChange = prevVal !== null && prevVal > 0 ? ((current - prevVal) / prevVal) * 100 : null;
  const yoyIdx = n - 13;
  const yoyVal = yoyIdx >= 0 ? values[yoyIdx] : null;
  const yoyChange = yoyVal !== null && yoyVal > 0 ? ((current - yoyVal) / yoyVal) * 100 : null;
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = n ? sum / n : 0;
  let bestIdx = 0;
  values.forEach((v, i) => {
    if (v > values[bestIdx]) bestIdx = i;
  });
  return { current, momChange, yoyChange, avg, sum, best: { value: values[bestIdx], period: periods[bestIdx] } };
}

export function getLatestKnownStatus(ctx: IncomeContext, memberId: string, y: number, m: number): string | null {
  let yy = y;
  let mm = m;
  for (let i = 0; i < 24; i++) {
    const rec = ctx.actualsByKey.get(`${memberId}|${yy}-${mm}`);
    if (rec) {
      if (rec.agentStatus) return rec.agentStatus;
      if (rec.active !== undefined) return rec.active ? "ACTIVE" : "INACTIVE";
    }
    mm--;
    if (mm < 1) {
      mm = 12;
      yy--;
    }
  }
  return null;
}

export interface StatusComposition {
  active: number;
  inactive: number;
  terminated: number;
}

export function computeStatusComposition(ctx: IncomeContext, scope: TrendScope, selectedMemberId: string, y: number, m: number): StatusComposition {
  const users = scope === "team" ? [...ctx.membersById.values()] : [ctx.membersById.get(selectedMemberId)!, ...descendants(ctx, selectedMemberId)].filter(Boolean);
  let active = 0,
    inactive = 0,
    terminated = 0;
  for (const uu of users) {
    const status = getLatestKnownStatus(ctx, uu.id, y, m);
    if (status === "ACTIVE") active++;
    else if (status === "TERMINATED") terminated++;
    else if (status === "INACTIVE") inactive++;
  }
  return { active, inactive, terminated };
}

export interface AchievementComposition {
  achieved: number;
  missed: number;
  noTarget: number;
}

export function computeTargetAchievementComposition(
  ctx: IncomeContext,
  scope: TrendScope,
  selectedMemberId: string,
  y: number,
  m: number,
  actualField: "actualFYP" | "actualNBC" | "actualFYC",
  targetField: "targetFYP" | "targetNBC" | "targetFYC",
): AchievementComposition {
  const users = scope === "team" ? [...ctx.membersById.values()] : [ctx.membersById.get(selectedMemberId)!, ...descendants(ctx, selectedMemberId)].filter(Boolean);
  let achieved = 0,
    missed = 0,
    noTarget = 0;
  for (const uu of users) {
    const goal = getGoal(ctx, uu.id, y, m);
    const target = goal[targetField] || 0;
    if (!target || target <= 0) {
      noTarget++;
      continue;
    }
    const actual = getActual(ctx, uu.id, y, m)[actualField] || 0;
    if (actual >= target) achieved++;
    else missed++;
  }
  return { achieved, missed, noTarget };
}
