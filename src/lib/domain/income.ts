// Faithful TypeScript port of the commission engine in
// PRIMETEAM_Goal_Setting_Planner.html (functions: computeIncome, computeRA,
// nextTierInfo, tierRateByMin, persistencyModifier, renewalBonusModifier,
// agRybRate, computeQuarterNBC/AnnualNBC/FYC12mo, allDescendants* family).
// The only structural change from the original is that every lookup reads
// from an explicit `IncomeContext` (loaded once per request from Postgres)
// instead of a global in-memory `DB` object — the math itself is unchanged.

export const AL_ROLES = ["UM", "AM", "DM", "SDM"] as const;
export type OrgRole = "AG" | "UM" | "AM" | "DM" | "SDM" | "VP" | "AGP";

export interface Tier {
  min: number;
  rate: number;
}

export interface RybMatrix {
  nbcBands: number[];
  persistBands: number[];
  rates: number[][];
}

export interface RetentionCriterion {
  fyc: number;
  agents: number;
  persistency: number;
}

export interface SettingsData {
  persistencyModifierTiers: Tier[];
  renewalBonusModifierTiers: Tier[];
  qbTiers: Tier[];
  abTiers: Tier[];
  agRybMatrix: RybMatrix;
  alOverridingTiers: Tier[];
  alQBTiers: Tier[];
  alABTiers: Tier[];
  odiChildRateAL: number;
  odiGrandchildRateAL: number;
  odiThresholdAL: number;
  roRateAL: number;
  vpOverridingTiers: Tier[];
  vpQBTiers: Tier[];
  vpABTiers: Tier[];
  odiChildRateVP: number;
  odiGrandchildRateVP: number;
  odiThresholdVP: number;
  roRateVP: number;
  agpOverridingTiers: Tier[];
  agpQBTiers: Tier[];
  agpABTiers: Tier[];
  odiChildRateAGP: number;
  odiThresholdAGP: number;
  roRateAGP: number;
  structureExtBonusAmount: number;
  raThreshold: number;
  raRate: number;
  raMonths: number;
  raNewAgentNBCThreshold: number;
  retentionCriteria: Partial<Record<OrgRole, RetentionCriterion>>;
}

export interface MemberLite {
  id: string;
  role: OrgRole;
  parentId: string | null;
  recruiterId: string | null;
  joinMonth: number | null;
  joinYear: number | null;
}

export interface ActualInput {
  actualFYP: number;
  actualNBC: number;
  actualFYC: number;
  actualRYC: number;
  priorYearNBC: number;
  persistency: number;
  active: boolean;
  personalUnitNBC: number;
  newALPromotions: number;
  newVPPromotions: number;
}

const DEFAULT_ACTUAL: ActualInput = {
  actualFYP: 0,
  actualNBC: 0,
  actualFYC: 0,
  actualRYC: 0,
  priorYearNBC: 0,
  persistency: 1,
  active: true,
  personalUnitNBC: 0,
  newALPromotions: 0,
  newVPPromotions: 0,
};

export interface IncomeContext {
  membersById: Map<string, MemberLite>;
  childrenByParent: Map<string, string[]>;
  actualsByKey: Map<string, ActualInput>;
  settings: SettingsData;
}

export function buildIncomeContext(members: MemberLite[], actuals: Array<{ memberId: string; year: number; month: number } & ActualInput>, settings: SettingsData): IncomeContext {
  const membersById = new Map(members.map((m) => [m.id, m]));
  const childrenByParent = new Map<string, string[]>();
  for (const m of members) {
    if (!m.parentId) continue;
    const list = childrenByParent.get(m.parentId) ?? [];
    list.push(m.id);
    childrenByParent.set(m.parentId, list);
  }
  const actualsByKey = new Map<string, ActualInput>();
  for (const a of actuals) {
    actualsByKey.set(pKey(a.memberId, a.year, a.month), a);
  }
  return { membersById, childrenByParent, actualsByKey, settings };
}

export function pKey(memberId: string, y: number, m: number) {
  return `${memberId}|${y}-${m}`;
}

export function getActual(ctx: IncomeContext, memberId: string, y: number, m: number): ActualInput {
  return ctx.actualsByKey.get(pKey(memberId, y, m)) ?? DEFAULT_ACTUAL;
}

export function children(ctx: IncomeContext, id: string): MemberLite[] {
  return (ctx.childrenByParent.get(id) ?? []).map((cid) => ctx.membersById.get(cid)!).filter(Boolean);
}

export function descendants(ctx: IncomeContext, id: string): MemberLite[] {
  const out: MemberLite[] = [];
  for (const c of children(ctx, id)) {
    out.push(c);
    out.push(...descendants(ctx, c.id));
  }
  return out;
}

export function allAGUnder(ctx: IncomeContext, id: string): MemberLite[] {
  return descendants(ctx, id).filter((u) => u.role === "AG");
}

export function allALUnder(ctx: IncomeContext, id: string): MemberLite[] {
  return descendants(ctx, id).filter((u) => AL_ROLES.includes(u.role as (typeof AL_ROLES)[number]));
}

export function hasActualData(ctx: IncomeContext, memberId: string, y: number, m: number): boolean {
  return ctx.actualsByKey.has(pKey(memberId, y, m));
}

export function getRetentionCriteria(ctx: IncomeContext, role: OrgRole): RetentionCriterion {
  return ctx.settings.retentionCriteria[role] ?? { fyc: 0, agents: 0, persistency: 0.75 };
}

export function tierRateByMin(value: number, tiers: Tier[]): number {
  if (!tiers?.length) return 0;
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let rate = 0;
  for (const t of sorted) {
    if (value >= t.min) rate = t.rate;
    else break;
  }
  return rate;
}

export interface NextTierInfo {
  hasNext: boolean;
  remaining?: number;
  nextRate?: number;
  currentRate?: number;
}

export function nextTierInfo(value: number, tiers: Tier[]): NextTierInfo {
  if (!tiers?.length) return { hasNext: false };
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let curIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (value >= sorted[i].min) curIdx = i;
    else break;
  }
  if (curIdx < sorted.length - 1) {
    const next = sorted[curIdx + 1];
    return { hasNext: true, remaining: next.min - value, nextRate: next.rate, currentRate: curIdx >= 0 ? sorted[curIdx].rate : 0 };
  }
  return { hasNext: false };
}

export function persistencyModifier(ctx: IncomeContext, persistency: number): number {
  return tierRateByMin(persistency, ctx.settings.persistencyModifierTiers);
}

export function renewalBonusModifier(ctx: IncomeContext, persistency: number): number {
  return tierRateByMin(persistency, ctx.settings.renewalBonusModifierTiers);
}

export function agRybRate(ctx: IncomeContext, persistency: number, priorYearNBC: number): number {
  const mx = ctx.settings.agRybMatrix;
  let rowIdx = 0;
  mx.persistBands.forEach((b, i) => {
    if (persistency >= b) rowIdx = i;
  });
  let colIdx = 0;
  mx.nbcBands.forEach((b, i) => {
    if (priorYearNBC >= b) colIdx = i;
  });
  return mx.rates[rowIdx]?.[colIdx] ?? 0;
}

export function getQuarterMonths(m: number): [number, number, number] {
  const q = Math.floor((m - 1) / 3);
  return [q * 3 + 1, q * 3 + 2, q * 3 + 3];
}

export function computeQuarterNBC(ctx: IncomeContext, memberId: string, y: number, m: number, liveOverride?: number): number {
  return getQuarterMonths(m).reduce((sum, mm) => {
    if (mm === m && liveOverride !== undefined) return sum + liveOverride;
    return sum + (getActual(ctx, memberId, y, mm).actualNBC || 0);
  }, 0);
}

export function computeAnnualNBC(ctx: IncomeContext, memberId: string, y: number, m: number, liveOverride?: number): number {
  let sum = 0;
  for (let mm = 1; mm <= 12; mm++) {
    sum += mm === m && liveOverride !== undefined ? liveOverride : getActual(ctx, memberId, y, mm).actualNBC || 0;
  }
  return sum;
}

export function computeFYC12mo(ctx: IncomeContext, memberId: string, y: number, m: number, liveOverride?: number): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let mm = m - i;
    let yy = y;
    while (mm < 1) {
      mm += 12;
      yy -= 1;
    }
    sum += i === 0 && liveOverride !== undefined ? liveOverride : getActual(ctx, memberId, yy, mm).actualFYC || 0;
  }
  return sum;
}

export function computeFYC12moForRisk(ctx: IncomeContext, memberId: string, y: number, m: number, liveOverride?: number): number {
  const u = ctx.membersById.get(memberId);
  const isLeader = u && (AL_ROLES.includes(u.role as (typeof AL_ROLES)[number]) || u.role === "VP" || u.role === "AGP");
  let sum = computeFYC12mo(ctx, memberId, y, m, liveOverride);
  if (isLeader) {
    for (const d of descendants(ctx, memberId)) sum += computeFYC12mo(ctx, d.id, y, m);
  }
  return sum;
}

export function computeAgentCountUnder(ctx: IncomeContext, memberId: string): number {
  return allAGUnder(ctx, memberId).length;
}

export function allDescendantsProductionNBC(ctx: IncomeContext, memberId: string, y: number, m: number): number {
  let sum = 0;
  for (const d of descendants(ctx, memberId)) sum += getActual(ctx, d.id, y, m).actualNBC || 0;
  return sum;
}

export function allDescendantsProductionRYC(ctx: IncomeContext, memberId: string, y: number, m: number): number {
  let sum = 0;
  for (const d of descendants(ctx, memberId)) sum += getActual(ctx, d.id, y, m).actualRYC || 0;
  return sum;
}

export function allDescendantsQuarterNBC(ctx: IncomeContext, memberId: string, y: number, m: number): number {
  let sum = 0;
  for (const d of descendants(ctx, memberId)) sum += computeQuarterNBC(ctx, d.id, y, m);
  return sum;
}

export function allDescendantsAnnualNBC(ctx: IncomeContext, memberId: string, y: number, m: number): number {
  let sum = 0;
  for (const d of descendants(ctx, memberId)) sum += computeAnnualNBC(ctx, d.id, y, m);
  return sum;
}

// Recruiting Allowance — paid to whoever recruited a new AG, regardless of the
// recruiter's own position. RA = new agent's NBC this month x rate x recruiter's
// own persistency modifier (capped at 100%), only while within the payout
// window (raMonths) from the new agent's join date, and only if the recruiter
// itself cleared its own quarterly NBC threshold this period.
export function computeRA(ctx: IncomeContext, memberId: string, y: number, m: number, recruiterActual?: ActualInput): { total: number; count: number } {
  const s = ctx.settings;
  const ra = recruiterActual ?? getActual(ctx, memberId, y, m);
  const raQuarterNBC = computeQuarterNBC(ctx, memberId, y, m, ra.actualNBC);
  if (raQuarterNBC < s.raThreshold) return { total: 0, count: 0 };
  const mod = Math.min(persistencyModifier(ctx, ra.persistency), 1.0);
  if (mod <= 0) return { total: 0, count: 0 };
  const recruits = [...ctx.membersById.values()].filter((u) => u.recruiterId === memberId && u.role === "AG");
  let total = 0;
  let count = 0;
  for (const ag of recruits) {
    if (ag.joinYear && ag.joinMonth) {
      const monthsElapsed = (y - ag.joinYear) * 12 + (m - ag.joinMonth);
      if (monthsElapsed < 0 || monthsElapsed >= s.raMonths) continue; // outside the payout window
    } // else: no join date on file — treat as always within window
    const agActual = getActual(ctx, ag.id, y, m);
    if (computeAnnualNBC(ctx, ag.id, y, m) < s.raNewAgentNBCThreshold) continue;
    total += (agActual.actualNBC || 0) * s.raRate;
    count++;
  }
  return { total: total * mod, count };
}

export interface IncomeLineItem {
  label: string;
  value: number;
  isBase?: boolean;
  nextTier?: NextTierInfo;
  periodic?: "annual";
}

export interface IncomeResult {
  role: OrgRole;
  items: IncomeLineItem[];
  total: number;
}

export function computeIncome(ctx: IncomeContext, memberId: string, y: number, m: number, override?: Partial<ActualInput>): IncomeResult {
  const u = ctx.membersById.get(memberId);
  if (!u) throw new Error(`Unknown member ${memberId}`);
  const a: ActualInput = { ...getActual(ctx, memberId, y, m), ...override };
  const s = ctx.settings;
  const result: IncomeResult = { role: u.role, items: [], total: 0 };
  const persistMod = persistencyModifier(ctx, a.persistency);
  const liveNBC = override?.actualNBC !== undefined ? override.actualNBC : undefined;
  const myQuarterNBC = computeQuarterNBC(ctx, memberId, y, m, liveNBC);
  const myAnnualNBC = computeAnnualNBC(ctx, memberId, y, m, liveNBC);

  if (u.role === "AG") {
    const commission = a.actualFYC || 0;
    const qbRate = tierRateByMin(myQuarterNBC, s.qbTiers);
    const qb = myQuarterNBC * qbRate * persistMod;
    const abRate = tierRateByMin(myAnnualNBC, s.abTiers);
    const ab = myAnnualNBC * abRate * persistMod;
    const rybRate = agRybRate(ctx, a.persistency, a.priorYearNBC);
    const ryb = a.actualRYC * rybRate;
    result.items = [
      { label: "Commission (จาก Actual FYC ที่บันทึก/นำเข้า)", value: commission },
      { label: `Quarterly Bonus (QB) — เทียร์ ${(qbRate * 100).toFixed(1)}% × Persist ${(persistMod * 100).toFixed(0)}%`, value: qb, nextTier: nextTierInfo(myQuarterNBC, s.qbTiers) },
      { label: `Annual Bonus (AB) — เทียร์ ${(abRate * 100).toFixed(2)}% × Persist ${(persistMod * 100).toFixed(0)}%`, value: ab, nextTier: nextTierInfo(myAnnualNBC, s.abTiers), periodic: "annual" },
      { label: `Renewal Year Bonus (RYB) — เทียร์ ${(rybRate * 100).toFixed(1)}% (NBC ปีก่อน ${fmt(a.priorYearNBC)})`, value: ryb },
    ];
  } else if (AL_ROLES.includes(u.role as (typeof AL_ROLES)[number])) {
    const teamNBC = allDescendantsProductionNBC(ctx, memberId, y, m) + a.actualNBC;
    const teamQuarterNBC = allDescendantsQuarterNBC(ctx, memberId, y, m) + myQuarterNBC;
    const teamAnnualNBC = allDescendantsAnnualNBC(ctx, memberId, y, m) + myAnnualNBC;
    const teamRYC = allDescendantsProductionRYC(ctx, memberId, y, m) + a.actualRYC;
    const activeMult = a.active ? 1 : 0;

    const overrideRate = tierRateByMin(teamNBC, s.alOverridingTiers);
    const overriding = teamNBC * overrideRate * persistMod * activeMult;
    const qbRate = tierRateByMin(teamQuarterNBC, s.alQBTiers);
    const qb = teamQuarterNBC * qbRate * persistMod * activeMult;
    const abRate = tierRateByMin(teamAnnualNBC, s.alABTiers);
    const ab = teamAnnualNBC * abRate * persistMod * activeMult;

    const childUnits = children(ctx, memberId).filter((c) => AL_ROLES.includes(c.role as (typeof AL_ROLES)[number]));
    const nbcChild = childUnits.reduce((sum, c) => sum + allDescendantsProductionNBC(ctx, c.id, y, m) + (getActual(ctx, c.id, y, m).actualNBC || 0), 0);
    const grandchildUnits = childUnits.flatMap((c) => children(ctx, c.id).filter((g) => AL_ROLES.includes(g.role as (typeof AL_ROLES)[number])));
    const nbcGrandchild = grandchildUnits.reduce((sum, g) => sum + allDescendantsProductionNBC(ctx, g.id, y, m) + (getActual(ctx, g.id, y, m).actualNBC || 0), 0);
    const odi = (s.odiChildRateAL * nbcChild + s.odiGrandchildRateAL * nbcGrandchild) * persistMod;

    const ro = s.roRateAL * teamRYC;
    const rbRate = renewalBonusModifier(ctx, a.persistency);
    const renewalBonus = ro * rbRate;
    const personalCommission = a.actualFYC || 0;

    result.items = [
      { label: "Team NBC (รวมทั้งสาย รวม AL เอง)", value: teamNBC, isBase: true },
      { label: "Commission จากผลงานส่วนตัว (จาก Actual FYC ที่บันทึก/นำเข้า)", value: personalCommission },
      { label: `Monthly Overriding — เทียร์ ${(overrideRate * 100).toFixed(1)}% × Persist ${(persistMod * 100).toFixed(0)}% × Active`, value: overriding, nextTier: nextTierInfo(teamNBC, s.alOverridingTiers) },
      { label: `โบนัสผลผลิตผู้บริหารรายไตรมาส (QB) — เทียร์ ${(qbRate * 100).toFixed(1)}%`, value: qb, nextTier: nextTierInfo(teamQuarterNBC, s.alQBTiers) },
      { label: `โบนัสผลผลิตผู้บริหารรายปี (AB) — เทียร์ ${(abRate * 100).toFixed(1)}%`, value: ab, nextTier: nextTierInfo(teamAnnualNBC, s.alABTiers), periodic: "annual" },
      { label: "ODI (หน่วยลูก 10% + หน่วยหลาน 2%)", value: odi },
      { label: `ค่าบำเหน็จผันแปรปีต่ออายุ (RO = ${(s.roRateAL * 100).toFixed(0)}% × ทีม RYC)`, value: ro },
      { label: `โบนัสปีต่ออายุ (Renewal Bonus) — เทียร์ ${(rbRate * 100).toFixed(0)}%`, value: renewalBonus },
    ];
  } else if (u.role === "VP" || u.role === "AGP") {
    const isVP = u.role === "VP";
    const overTiers = isVP ? s.vpOverridingTiers : s.agpOverridingTiers;
    const qbTiers = isVP ? s.vpQBTiers : s.agpQBTiers;
    const abTiers = isVP ? s.vpABTiers : s.agpABTiers;
    const odiChildRate = isVP ? s.odiChildRateVP : s.odiChildRateAGP;
    const odiGrandchildRate = isVP ? s.odiGrandchildRateVP : 0;
    const roRate = isVP ? s.roRateVP : s.roRateAGP;

    const totalNBC = allDescendantsProductionNBC(ctx, memberId, y, m) + a.actualNBC;
    const totalQuarterNBC = allDescendantsQuarterNBC(ctx, memberId, y, m) + myQuarterNBC;
    const totalAnnualNBC = allDescendantsAnnualNBC(ctx, memberId, y, m) + myAnnualNBC;
    const totalRYC = allDescendantsProductionRYC(ctx, memberId, y, m) + a.actualRYC;

    const overrideRate = tierRateByMin(totalNBC, overTiers);
    const overriding = totalNBC * overrideRate * persistMod;
    const qbRate = tierRateByMin(totalQuarterNBC, qbTiers);
    const qb = totalQuarterNBC * qbRate * persistMod;
    const abRate = tierRateByMin(totalAnnualNBC, abTiers);
    const ab = totalAnnualNBC * abRate * persistMod;

    const childRoleFilter = isVP ? (c: MemberLite) => AL_ROLES.includes(c.role as (typeof AL_ROLES)[number]) : (c: MemberLite) => c.role === "VP";
    const childUnits = children(ctx, memberId).filter(childRoleFilter);
    const nbcChild = childUnits.reduce((sum, c) => sum + allDescendantsProductionNBC(ctx, c.id, y, m) + (getActual(ctx, c.id, y, m).actualNBC || 0), 0);
    let nbcGrandchild = 0;
    if (isVP) {
      const grandchildUnits = childUnits.flatMap((c) => children(ctx, c.id).filter((g) => AL_ROLES.includes(g.role as (typeof AL_ROLES)[number])));
      nbcGrandchild = grandchildUnits.reduce((sum, g) => sum + allDescendantsProductionNBC(ctx, g.id, y, m) + (getActual(ctx, g.id, y, m).actualNBC || 0), 0);
    }
    const odi = (odiChildRate * nbcChild + odiGrandchildRate * nbcGrandchild) * persistMod;

    const ro = roRate * totalRYC;
    const rbRate = renewalBonusModifier(ctx, a.persistency);
    const renewalBonus = ro * rbRate;

    const structBonus = (a.newALPromotions || 0) * s.structureExtBonusAmount + (a.newVPPromotions || 0) * (s.structureExtBonusAmount * 3);
    const personalCommission = a.actualFYC || 0;

    result.items = [
      { label: `NBC รวมทุกสายงานใต้สังกัด (รวม ${u.role} เอง)`, value: totalNBC, isBase: true },
      { label: "Commission จากผลงานส่วนตัว (จาก Actual FYC ที่บันทึก/นำเข้า)", value: personalCommission },
      { label: `ค่าบำเหน็จผันแปร (Monthly Overriding) — เทียร์ ${(overrideRate * 100).toFixed(2)}% × Persist`, value: overriding, nextTier: nextTierInfo(totalNBC, overTiers) },
      { label: `โบนัสผลผลิตกลุ่มรายไตรมาส (QB) — เทียร์ ${(qbRate * 100).toFixed(2)}%`, value: qb, nextTier: nextTierInfo(totalQuarterNBC, qbTiers) },
      { label: `โบนัสผลผลิตกลุ่มรายปี (AB) — เทียร์ ${(abRate * 100).toFixed(2)}%`, value: ab, nextTier: nextTierInfo(totalAnnualNBC, abTiers), periodic: "annual" },
      { label: `ODI (กลุ่มลูก${isVP ? " + กลุ่มหลาน" : ""})`, value: odi },
      { label: `ค่าบำเหน็จผันแปรปีต่ออายุ (RO = ${(roRate * 100).toFixed(0)}% × ทีม RYC)`, value: ro },
      { label: `โบนัสปีต่ออายุ (Renewal Bonus) — เทียร์ ${(rbRate * 100).toFixed(0)}%`, value: renewalBonus },
      { label: "Structure Extension Bonus", value: structBonus },
    ];
  }

  const ra = computeRA(ctx, memberId, y, m, a);
  if (ra.count > 0 || ra.total > 0) {
    result.items.push({ label: `ค่าสรรหาตัวแทนใหม่ (RA) — ชวนมา ${ra.count} คนที่ยังอยู่ในช่วงจ่าย`, value: ra.total });
  }
  result.total = result.items.filter((i) => !i.isBase).reduce((sum, i) => sum + i.value, 0);
  return result;
}

export function fmt(n: number): string {
  return Math.round(n || 0).toLocaleString("th-TH");
}
