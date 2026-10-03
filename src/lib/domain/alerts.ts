// Faithful port of computeAlerts()/collectAllAlerts() from the offline HTML
// app — same thresholds, same severities, same logic. Operates on the same
// IncomeContext used by the commission engine (lib/domain/income.ts).
import {
  AL_ROLES,
  allALUnder,
  computeAgentCountUnder,
  computeFYC12moForRisk,
  computeQuarterNBC,
  getActual,
  getRetentionCriteria,
  hasActualData,
  type IncomeContext,
  type OrgRole,
} from "./income";

export type AlertSeverity = "red" | "yellow";

export interface Alert {
  memberId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
}

export function computeAlerts(ctx: IncomeContext, memberId: string, y: number, m: number): Alert[] {
  const u = ctx.membersById.get(memberId);
  if (!u) return [];
  const a = getActual(ctx, memberId, y, m);
  const s = ctx.settings;
  const alerts: Alert[] = [];

  // Skip threshold-based risk checks entirely if no actual data has been
  // submitted yet this period — otherwise everyone shows red/yellow on day 1
  // just because default values are 0.
  if (!hasActualData(ctx, memberId, y, m)) return alerts;

  const fyc12moComputed = computeFYC12moForRisk(ctx, memberId, y, m);
  const agentCountComputed = computeAgentCountUnder(ctx, memberId);
  const quarterNBCComputed = computeQuarterNBC(ctx, memberId, y, m);

  const isALorAbove = AL_ROLES.includes(u.role as (typeof AL_ROLES)[number]) || u.role === "VP" || u.role === "AGP";
  if (isALorAbove) {
    const crit = getRetentionCriteria(ctx, u.role);
    if (fyc12moComputed < crit.fyc) {
      const pct = crit.fyc > 0 ? fyc12moComputed / crit.fyc : 0;
      alerts.push({
        memberId,
        severity: pct < 0.8 ? "red" : "yellow",
        title: `เสี่ยงหลุดเกณฑ์รักษาตำแหน่ง ${u.role}`,
        detail: `FYC สะสม 12 เดือน (รวมทีม) = ${fmt(fyc12moComputed)} บาท (ต้องการ ≥ ${fmt(crit.fyc)})`,
      });
    }
    if (agentCountComputed < crit.agents) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "จำนวนตัวแทนใต้สังกัดไม่ครบเกณฑ์",
        detail: `มี ${agentCountComputed} คน (ต้องการ ≥ ${crit.agents} คน) สำหรับตำแหน่ง ${u.role}`,
      });
    }
    if (a.persistency < crit.persistency) {
      alerts.push({
        memberId,
        severity: "red",
        title: `อัตราความยั่งยืน (Persistency) ต่ำกว่าเกณฑ์รักษาตำแหน่ง ${u.role}`,
        detail: `ปัจจุบัน ${(a.persistency * 100).toFixed(1)}% (ขั้นต่ำ ${(crit.persistency * 100).toFixed(0)}%)`,
      });
    }
  }

  if (AL_ROLES.includes(u.role as (typeof AL_ROLES)[number])) {
    if (a.personalUnitNBC < s.odiThresholdAL) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "NBC หน่วยตรงไม่ถึงเกณฑ์ — เสี่ยง ODI ถูกแขวน",
        detail: `เดือนนี้ ${fmt(a.personalUnitNBC)} (ต้องการ ≥ ${fmt(s.odiThresholdAL)})`,
      });
    }
    if (quarterNBCComputed < s.raThreshold) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "NBC ส่วนตัวไตรมาสนี้ไม่ถึงเกณฑ์รับค่า RA",
        detail: `ไตรมาสนี้ ${fmt(quarterNBCComputed)} (ต้องการ ≥ ${fmt(s.raThreshold)})`,
      });
    }
  }

  if (u.role === "VP" || u.role === "AGP") {
    const odiThreshold = u.role === "VP" ? s.odiThresholdVP : s.odiThresholdAGP;
    if (a.personalUnitNBC < odiThreshold) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "ผลงานทีมตรงไม่ถึงเกณฑ์ — เสี่ยง ODI ถูกแขวน",
        detail: `เดือนนี้ ${fmt(a.personalUnitNBC)} (ต้องการ ≥ ${fmt(odiThreshold)})`,
      });
    }
    const alUnits = allALUnder(ctx, memberId);
    const activeUnits = alUnits.filter((al) => getActual(ctx, al.id, y, m).active).length;
    if (alUnits.length > 0 && activeUnits < alUnits.length * 0.7) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "จำนวนทีม AL ที่ Active ลดลงต่ำกว่าเกณฑ์",
        detail: `Active ${activeUnits} / ${alUnits.length} ทีม`,
      });
    }
  }

  if (u.role === "AG") {
    if (quarterNBCComputed < s.raThreshold) {
      alerts.push({
        memberId,
        severity: "yellow",
        title: "NBC ไตรมาสนี้ยังไม่ถึงเกณฑ์ขั้นต่ำ",
        detail: `ไตรมาสนี้ ${fmt(quarterNBCComputed)} (แนะนำ ≥ ${fmt(s.raThreshold)})`,
      });
    }
  }

  return alerts;
}

export function collectAllAlerts(ctx: IncomeContext, y: number, m: number): Alert[] {
  const out: Alert[] = [];
  for (const u of ctx.membersById.values()) {
    out.push(...computeAlerts(ctx, u.id, y, m));
  }
  return out;
}

function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString("th-TH");
}

export type { OrgRole };
