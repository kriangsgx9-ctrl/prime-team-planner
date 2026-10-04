// Ported from the HTML app's quarterly-evaluation functions.
import {
  AL_ROLES,
  getActual,
  getGoal,
  teamInclusiveActualFYP,
  teamInclusiveActualNBC,
  teamInclusiveTargetFYP,
  teamInclusiveTargetNBC,
  type IncomeContext,
  type OrgRole,
} from "./income";

export interface EvalCategory {
  key: string;
  icon: string;
  label: string;
}

export const EVAL_CATEGORIES_AG: EvalCategory[] = [
  { key: "sales", icon: "💼", label: "ทักษะการขาย / ปิดการขาย" },
  { key: "discipline", icon: "📋", label: "วินัย / ความสม่ำเสมอ" },
  { key: "selfDev", icon: "📚", label: "การพัฒนาตนเอง" },
  { key: "attitude", icon: "🤝", label: "ทัศนคติ / ทำงานร่วมทีม" },
  { key: "leadership", icon: "🌟", label: "ศักยภาพผู้นำ" },
];

export const EVAL_CATEGORIES_LEADER: EvalCategory[] = [
  { key: "teamMgmt", icon: "👥", label: "การบริหารทีม / มอบหมายงาน" },
  { key: "coaching", icon: "🎓", label: "การโค้ช / พัฒนาลูกทีม" },
  { key: "discipline", icon: "📋", label: "วินัย / ความรับผิดชอบ" },
  { key: "vision", icon: "🧭", label: "วิสัยทัศน์ / การวางแผนกลยุทธ์" },
  { key: "decision", icon: "⚖️", label: "การตัดสินใจ / แก้ปัญหา" },
];

export function getEvalCategories(role: OrgRole): EvalCategory[] {
  return role === "AG" ? EVAL_CATEGORIES_AG : EVAL_CATEGORIES_LEADER;
}

export function monthToQuarter(m: number): number {
  return Math.ceil(m / 3);
}

export function quarterMonthRange(q: number): [number, number] {
  return [(q - 1) * 3 + 1, q * 3];
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function quarterLabel(y: number, q: number): string {
  const [m1, m2] = quarterMonthRange(q);
  return `ไตรมาส ${q} ปี ${y + 543} (${MONTHS_TH[m1 - 1]}–${MONTHS_TH[m2 - 1]})`;
}

export function prevQuarter(y: number, q: number): { y: number; q: number } {
  return q > 1 ? { y, q: q - 1 } : { y: y - 1, q: 4 };
}

export function nextQuarter(y: number, q: number): { y: number; q: number } {
  return q < 4 ? { y, q: q + 1 } : { y: y + 1, q: 1 };
}

export function getQuartersBack(y: number, q: number, n: number): { y: number; q: number }[] {
  const out: { y: number; q: number }[] = [];
  let yy = y,
    qq = q;
  for (let i = 0; i < n; i++) {
    out.unshift({ y: yy, q: qq });
    const p = prevQuarter(yy, qq);
    yy = p.y;
    qq = p.q;
  }
  return out;
}

export function evalScoreAvg(scores: Record<string, number> | null | undefined, role: OrgRole): number | null {
  if (!scores) return null;
  const cats = getEvalCategories(role);
  const vals = cats.map((c) => scores[c.key]).filter((v) => v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function evalScoreColorClass(avg: number | null): string {
  if (avg === null) return "text-[var(--muted)]";
  if (avg >= 4) return "text-green-700";
  if (avg >= 2.5) return "text-amber-600";
  return "text-red-600";
}

// Quarter-level performance %: averages FYP/NBC achievement across the
// quarter's 3 months, team-inclusive for leader roles (matching how the rest
// of the app treats leader numbers) — used to plot the performance axis of
// the 9-box talent grid alongside the (separate) evaluation score axis.
export function computeQuarterPerformancePct(ctx: IncomeContext, memberId: string, y: number, q: number): number | null {
  const u = ctx.membersById.get(memberId);
  const isLeader = !!u && (AL_ROLES.includes(u.role as (typeof AL_ROLES)[number]) || u.role === "VP" || u.role === "AGP");
  const [m1, m2] = quarterMonthRange(q);
  let targetFYP = 0, actualFYP = 0, targetNBC = 0, actualNBC = 0;
  for (let m = m1; m <= m2; m++) {
    if (isLeader) {
      targetFYP += teamInclusiveTargetFYP(ctx, memberId, y, m);
      actualFYP += teamInclusiveActualFYP(ctx, memberId, y, m);
      targetNBC += teamInclusiveTargetNBC(ctx, memberId, y, m);
      actualNBC += teamInclusiveActualNBC(ctx, memberId, y, m);
    } else {
      targetFYP += getGoal(ctx, memberId, y, m).targetFYP || 0;
      actualFYP += getActual(ctx, memberId, y, m).actualFYP || 0;
      targetNBC += getGoal(ctx, memberId, y, m).targetNBC || 0;
      actualNBC += getActual(ctx, memberId, y, m).actualNBC || 0;
    }
  }
  // Uncapped — an achievement over 100% should read as such (and the box
  // classification below only cares about ">= 0.8", which an over-100%
  // value already satisfies just fine).
  const pcts: number[] = [];
  if (targetFYP > 0) pcts.push(actualFYP / targetFYP);
  if (targetNBC > 0) pcts.push(actualNBC / targetNBC);
  if (!pcts.length) return null;
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

export type EvalBoxKey = "star" | "goodPerf" | "resultsOnly" | "growing" | "core" | "watch" | "diamond" | "developing" | "risk";

// Classifies a person onto the 9-box talent grid: performance (target vs.
// actual, "WHAT" they produce) on one axis, evaluation score ("HOW" they
// work — behavior/quality) on the other. Surfaces people pure sales numbers
// hide: a top producer with attitude problems, or a quietly-strong performer
// nobody's evaluated yet.
export const EVAL_BOX_META: Record<EvalBoxKey, { label: string; tone: "green" | "yellow" | "red" }> = {
  star: { label: "ดาวเด่น", tone: "green" },
  goodPerf: { label: "ผลงานดี ต่อยอดได้", tone: "green" },
  resultsOnly: { label: "ผลงานดีแต่ต้องดูพฤติกรรม", tone: "yellow" },
  growing: { label: "กำลังไปได้ดี", tone: "green" },
  core: { label: "มาตรฐาน", tone: "yellow" },
  watch: { label: "ต้องจับตา", tone: "yellow" },
  diamond: { label: "มีศักยภาพ รอผลักดัน", tone: "yellow" },
  developing: { label: "ต้องพัฒนา", tone: "yellow" },
  risk: { label: "กลุ่มเสี่ยงสูง", tone: "red" },
};

export const EVAL_BOX_GRID: EvalBoxKey[][] = [
  ["diamond", "growing", "star"],
  ["developing", "core", "goodPerf"],
  ["risk", "watch", "resultsOnly"],
];

export function evalBoxClassify(perfPct: number | null, evalAvg: number | null): EvalBoxKey | null {
  if (perfPct === null || evalAvg === null) return null;
  const perfTier = perfPct >= 0.8 ? 2 : perfPct >= 0.4 ? 1 : 0;
  const evalTier = evalAvg >= 4 ? 2 : evalAvg >= 2.5 ? 1 : 0;
  return EVAL_BOX_GRID[2 - evalTier][perfTier];
}

export type NineBoxRow = { id: string; name: string; role: OrgRole; evalAvg: number | null; perfPct: number | null; box: EvalBoxKey | null };

export function nineBoxEmptyMessage(rows: NineBoxRow[]): string {
  const noEval = rows.every((r) => r.evalAvg === null);
  const noPerf = rows.every((r) => r.perfPct === null);
  if (noEval && noPerf) return 'ยังไม่มีทั้งคะแนนประเมินและเป้าหมายของทีมในไตรมาสนี้ — ให้ประเมินที่ด้านบน และตั้งเป้า FYP/NBC ที่หน้า "กำหนดเป้าหมาย" ให้ครบทั้ง 3 เดือนของไตรมาสก่อน';
  if (noEval) return "ยังไม่มีใครในสายได้รับการประเมินในไตรมาสนี้เลย — เริ่มประเมินได้ที่การ์ดด้านบน";
  if (noPerf) return 'ยังไม่มีใครในสายถูกตั้งเป้า FYP/NBC ในไตรมาสนี้เลย — ต้องตั้งเป้าที่หน้า "กำหนดเป้าหมาย" ให้ครบทั้ง 3 เดือนของไตรมาสก่อน ระบบถึงจะคำนวณแกนผลงานได้';
  return "มีทั้งคะแนนประเมินและเป้าหมายอยู่บ้าง แต่ยังไม่มีใครมีครบทั้งสองด้านพร้อมกันในไตรมาสนี้";
}

// Textual summary of the 9-box grid — named standouts (stars, risks,
// hidden-potential, results-without-behavior) so a leader gets a reading
// without having to parse all 9 cells themselves.
export function generateEvalInsights(rows: NineBoxRow[]): string[] {
  const total = rows.length;
  const evaluated = rows.filter((r) => r.evalAvg !== null);
  const insights: string[] = [];
  if (!total) return insights;
  insights.push(`ทีมทั้งสายมีทั้งหมด ${total} คน ประเมินแล้ว ${evaluated.length} คน (${Math.round((evaluated.length / total) * 100)}%)`);
  if (evaluated.length) {
    const avgAll = evaluated.reduce((s, r) => s + (r.evalAvg ?? 0), 0) / evaluated.length;
    insights.push(`คะแนนประเมินเฉลี่ยทั้งสาย ${avgAll.toFixed(1)}/5`);
  }
  const byBox = (key: EvalBoxKey) => rows.filter((r) => r.box === key);
  const names = (list: NineBoxRow[]) => list.slice(0, 5).map((r) => r.name).join(", ") + (list.length > 5 ? " และอื่นๆ" : "");

  const star = byBox("star");
  if (star.length) insights.push(`⭐ ดาวเด่น (ผลงาน+คะแนนประเมินสูงทั้งคู่) ${star.length} คน: ${names(star)} — ควรพิจารณาต่อยอด/เลื่อนตำแหน่ง`);
  const risk = byBox("risk");
  if (risk.length) insights.push(`🔴 กลุ่มเสี่ยงสูง (ผลงาน+คะแนนประเมินต่ำทั้งคู่) ${risk.length} คน: ${names(risk)} — ควรวางแผนพัฒนาเร่งด่วนหรือทบทวนความเหมาะสม`);
  const diamond = byBox("diamond");
  if (diamond.length) insights.push(`💎 มีศักยภาพแต่ผลงานยังไม่ถึงเป้า ${diamond.length} คน: ${names(diamond)} — โค้ชเพิ่มเพื่อดันผลงาน`);
  const resultsOnly = byBox("resultsOnly");
  if (resultsOnly.length) insights.push(`⚠️ ผลงานดีแต่คะแนนประเมินต่ำ ${resultsOnly.length} คน: ${names(resultsOnly)} — ควรตรวจสอบพฤติกรรม/วินัย ก่อนที่ผลงานจะได้รับผลกระทบ`);
  const noEval = rows.filter((r) => r.evalAvg === null);
  if (noEval.length) insights.push(`⚪ ยังไม่ได้รับการประเมินในไตรมาสนี้ ${noEval.length} คน — ควรติดตามให้หัวหน้าสายประเมินให้ครบก่อนปิดไตรมาส`);
  return insights;
}
