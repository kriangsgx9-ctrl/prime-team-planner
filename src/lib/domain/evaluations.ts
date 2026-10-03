// Ported from the HTML app's quarterly-evaluation functions.
import type { OrgRole } from "./income";

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
