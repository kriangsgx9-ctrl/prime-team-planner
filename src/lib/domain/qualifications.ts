// Ported from the HTML app's qualification-tracking functions
// (computeQualMetricValue, qualScopeMatches, computeQualificationsProgress).
import { AL_ROLES, compute2MoSum, computeAnnualFYP, computeAnnualNBC, computeFYC12moForRisk, computeQuarterNBC, getActual, getGoal, hasActualData, type IncomeContext, type MemberLite, type OrgRole } from "./income";

export type QualMetric =
  | "actualFYP"
  | "actualNBC"
  | "actualFYC"
  | "quarterNBC"
  | "annualNBC"
  | "annualFYP"
  | "fyc12mo"
  | "fyp2mo"
  | "fyc2mo"
  | "nbc2mo"
  | "persistency"
  | "active"
  | "newRecruitsCount"
  | "nbcAchievementPct"
  | "fypAchievementPct";

export type QualScope = "ALL" | "AG" | "AL" | "VP";

export const QUAL_METRIC_LABEL: Record<QualMetric, string> = {
  actualFYP: "FYP รายเดือน",
  actualNBC: "NBC รายเดือน",
  actualFYC: "FYC รายเดือน",
  quarterNBC: "NBC รายไตรมาส (สะสม)",
  annualNBC: "NBC รายปี (สะสม)",
  annualFYP: "FYP รายปี (สะสม)",
  fyc12mo: "FYC สะสม 12 เดือน (≈รายปี)",
  fyp2mo: "FYP สะสม 2 เดือน",
  fyc2mo: "FYC สะสม 2 เดือน",
  nbc2mo: "NBC สะสม 2 เดือน",
  persistency: "% Persistency",
  active: "สถานะ Active (1=Active)",
  newRecruitsCount: "จำนวนตัวแทนใหม่ที่ชวน (New Code) เดือนนี้",
  nbcAchievementPct: "% สำเร็จเป้า NBC (รายเดือน)",
  fypAchievementPct: "% สำเร็จเป้า FYP (รายเดือน)",
};

export const QUAL_METRIC_PERIOD: Record<QualMetric, string> = {
  actualFYP: "เดือน",
  actualNBC: "เดือน",
  actualFYC: "เดือน",
  quarterNBC: "ไตรมาส",
  annualNBC: "ปี",
  annualFYP: "ปี",
  fyc12mo: "ปี (rolling 12 เดือน)",
  fyp2mo: "2 เดือน (กำหนดเดือนเริ่ม)",
  fyc2mo: "2 เดือน (กำหนดเดือนเริ่ม)",
  nbc2mo: "2 เดือน (กำหนดเดือนเริ่ม)",
  persistency: "ปัจจุบัน",
  active: "ปัจจุบัน",
  newRecruitsCount: "เดือน",
  nbcAchievementPct: "เดือน",
  fypAchievementPct: "เดือน",
};

export const QUAL_SCOPE_LABEL: Record<QualScope, string> = { ALL: "ทุกตำแหน่ง", AG: "AG เท่านั้น", AL: "AL เท่านั้น", VP: "VP/AGP เท่านั้น" };

export interface QualificationDef {
  id: string;
  icon: string;
  name: string;
  scope: QualScope;
  metric: QualMetric;
  threshold: number;
  periodStartMonth: number | null;
}

export function qualScopeMatches(u: MemberLite, q: QualificationDef): boolean {
  return q.scope === "ALL" || (q.scope === "AG" && u.role === "AG") || (q.scope === "AL" && AL_ROLES.includes(u.role as (typeof AL_ROLES)[number])) || (q.scope === "VP" && (u.role === "VP" || u.role === "AGP"));
}

export function computeQualMetricValue(ctx: IncomeContext, memberId: string, y: number, m: number, q: QualificationDef): number {
  const a = getActual(ctx, memberId, y, m);
  const goal = getGoal(ctx, memberId, y, m);
  switch (q.metric) {
    case "actualNBC":
      return a.actualNBC || 0;
    case "actualFYP":
      return a.actualFYP || 0;
    case "actualFYC":
      return a.actualFYC || 0;
    case "quarterNBC":
      return computeQuarterNBC(ctx, memberId, y, m);
    case "annualNBC":
      return computeAnnualNBC(ctx, memberId, y, m);
    case "annualFYP":
      return computeAnnualFYP(ctx, memberId, y, m);
    case "fyp2mo":
      return compute2MoSum(ctx, memberId, y, m, "actualFYP", q.periodStartMonth || 1);
    case "fyc2mo":
      return compute2MoSum(ctx, memberId, y, m, "actualFYC", q.periodStartMonth || 1);
    case "nbc2mo":
      return compute2MoSum(ctx, memberId, y, m, "actualNBC", q.periodStartMonth || 1);
    case "fyc12mo":
      return computeFYC12moForRisk(ctx, memberId, y, m);
    case "persistency":
      return a.persistency || 0;
    case "active":
      return a.active ? 1 : 0;
    case "newRecruitsCount":
      return [...ctx.membersById.values()].filter((x) => x.recruiterId === memberId && x.role === "AG" && x.joinYear === y && x.joinMonth === m).length;
    case "nbcAchievementPct":
      return goal.targetNBC > 0 ? (a.actualNBC || 0) / goal.targetNBC : 0;
    case "fypAchievementPct":
      return goal.targetFYP > 0 ? (a.actualFYP || 0) / goal.targetFYP : 0;
    default:
      return 0;
  }
}

export interface QualProgress {
  qual: QualificationDef;
  achieved: boolean;
  currentValue: number;
  remaining: number;
  isPct: boolean;
}

export function computeQualificationsProgress(ctx: IncomeContext, memberId: string, y: number, m: number, qualifications: QualificationDef[]): QualProgress[] {
  if (!hasActualData(ctx, memberId, y, m)) return [];
  const u = ctx.membersById.get(memberId);
  if (!u) return [];
  const out: QualProgress[] = [];
  for (const q of qualifications) {
    if (!qualScopeMatches(u, q)) continue;
    const isPct = q.metric.includes("Pct") || q.metric === "persistency";
    const value = computeQualMetricValue(ctx, memberId, y, m, q);
    const achieved = value >= q.threshold;
    out.push({ qual: q, achieved, currentValue: value, remaining: achieved ? 0 : q.threshold - value, isPct });
  }
  return out;
}

export function qualMetricUnit(metric: QualMetric): string {
  const map: Partial<Record<QualMetric, string>> = {
    actualFYP: "FYP", actualNBC: "NBC", actualFYC: "FYC",
    quarterNBC: "NBC", annualNBC: "NBC", annualFYP: "FYP", fyc12mo: "FYC",
    fyp2mo: "FYP", fyc2mo: "FYC", nbc2mo: "NBC",
    persistency: "%", nbcAchievementPct: "%", fypAchievementPct: "%",
    newRecruitsCount: "คน", active: "",
  };
  return map[metric] || "";
}

export type { OrgRole };
