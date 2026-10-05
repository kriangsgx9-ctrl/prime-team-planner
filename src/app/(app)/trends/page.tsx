import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { AL_ROLES, fmt } from "@/lib/domain/income";
import { computeStatusComposition, computeTargetAchievementComposition, computeTrendInsights, getMonthsBack, getTrendValue, type TrendField, type TrendScope } from "@/lib/domain/trends";
import { loadIncomeContext } from "@/lib/services/income-context";
import { Card, IconBadge } from "@/components/ui/primitives";
import { TrendSparkline } from "@/components/TrendSparkline";
import { TrendControls } from "./TrendControls";
import { AchieveMetricPicker } from "./AchieveMetricPicker";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const METRIC_LABEL: Record<TrendField, string> = { actualFYP: "FYP", actualNBC: "NBC", actualFYC: "FYC" };
const ACHIEVE_FIELD_MAP = {
  FYP: { actual: "actualFYP", target: "targetFYP" },
  NBC: { actual: "actualNBC", target: "targetNBC" },
  FYC: { actual: "actualFYC", target: "targetFYC" },
} as const;

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string; granularity?: string; scope?: string; metric?: string; achieveMetric?: string }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const granularity = sp.granularity === "year" ? "year" : "month";
  const scope: TrendScope = sp.scope === "team" ? "team" : "person";
  const metric = (["actualFYP", "actualNBC", "actualFYC"] as const).includes(sp.metric as TrendField) ? (sp.metric as TrendField) : "actualNBC";
  const achieveMetric = (["FYP", "NBC", "FYC"] as const).includes(sp.achieveMetric as never) ? (sp.achieveMetric as "FYP" | "NBC" | "FYC") : "NBC";

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));
  const memberId = sp.memberId ?? sorted[0]?.id;
  const member = sorted.find((m) => m.id === memberId) ?? sorted[0];

  if (!member) {
    return (
      <Card>
        <p>ยังไม่มีสมาชิกในระบบ</p>
      </Card>
    );
  }

  const isLeader = AL_ROLES.includes(member.role as (typeof AL_ROLES)[number]) || member.role === "VP" || member.role === "AGP";
  const scopeLabel = scope === "team" ? "ทั้งบริษัท" : `${member.name}${isLeader ? " (รวมทีม)" : ""}`;

  const ctx = await loadIncomeContext(year, 3); // need up to 4 years of history for the yearly view

  let periods: { y: number; m: number }[];
  let values: number[];
  let periodLabels: string[];
  if (granularity === "month") {
    periods = getMonthsBack(year, month, 12);
    values = periods.map((p) => getTrendValue(ctx, scope, metric, p.y, p.m, member.id));
    periodLabels = periods.map((p) => MONTHS_TH[p.m - 1]);
  } else {
    const nYears = 4;
    periods = Array.from({ length: nYears }, (_, i) => ({ y: year - (nYears - 1 - i), m: 12 }));
    values = periods.map((p) => {
      let sum = 0;
      for (let mm = 1; mm <= 12; mm++) sum += getTrendValue(ctx, scope, metric, p.y, mm, member.id);
      return sum;
    });
    periodLabels = periods.map((p) => (p.y + 543).toString());
  }

  const insights = computeTrendInsights(values, periods);
  const bestLabel = granularity === "month" ? `${MONTHS_TH[insights.best.period.m - 1]} ${insights.best.period.y + 543}` : (insights.best.period.y + 543).toString();

  const statusComp = computeStatusComposition(ctx, scope, member.id, year, month);
  const statusTotal = statusComp.active + statusComp.inactive + statusComp.terminated;
  const achFields = ACHIEVE_FIELD_MAP[achieveMetric];
  const achieveComp = computeTargetAchievementComposition(ctx, scope, member.id, year, month, achFields.actual, achFields.target);
  const achieveTotal = achieveComp.achieved + achieveComp.missed + achieveComp.noTarget;
  const pctOf = (v: number, total: number) => (total > 0 ? ` (${Math.round((v / total) * 100)}%)` : "");

  return (
    <div className="space-y-4">
      <Card bgImage="/images/hero/bar-chart.jpg">
        <h1 className="mb-1 flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="📊" variant="soft" />
          แนวโน้มผลงาน
        </h1>
        <p className="mb-3 text-sm text-[var(--muted)]">วิเคราะห์ผลงานย้อนหลัง เปรียบเทียบเดือนต่อเดือนและปีต่อปี</p>
        <TrendControls members={sorted} roleLabel={ROLE_LABEL} memberId={member.id} granularity={granularity} scope={scope} metric={metric} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)] p-4 text-white">
          <div className="text-xs font-bold opacity-80">
            {granularity === "month" ? "เดือนนี้" : "ปีนี้"} · {METRIC_LABEL[metric]}
          </div>
          <div className="text-xl font-extrabold">{fmt(insights.current)}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[var(--orange)] to-[var(--orange-cta)] p-4 text-white">
          <div className="text-xs font-bold opacity-80">ค่าเฉลี่ยต่อ{granularity === "month" ? "เดือน" : "ปี"}</div>
          <div className="text-xl font-extrabold">{fmt(Math.round(insights.avg))}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ChangeBadge label={granularity === "month" ? "เทียบเดือนที่แล้ว" : "เทียบปีที่แล้ว"} change={insights.momChange} />
        {granularity === "month" ? <ChangeBadge label="เทียบช่วงเดียวกันปีก่อน" change={insights.yoyChange} /> : <SubBadge label="ปีที่ดีที่สุด" value={fmt(insights.best.value)} sub={bestLabel} />}
      </div>

      <Card>
        <h2 className="mb-2 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="📈" variant="green" />
          แนวโน้ม {METRIC_LABEL[metric]} — {scopeLabel}
        </h2>
        <TrendSparkline values={values} />
        <div className="mt-1 flex justify-between text-[10px] font-bold text-[var(--muted)]">
          {periodLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="🩺" variant="soft" />
          สุขภาพทีม ณ ตอนนี้
        </h2>
        <div className="mb-4">
          <div className="mb-2 text-center text-sm font-extrabold">สถานะตัวแทน</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatusTile label="Active" value={statusComp.active} total={statusTotal} color="text-green-700" pctOf={pctOf} />
            <StatusTile label="Inactive" value={statusComp.inactive} total={statusTotal} color="text-amber-600" pctOf={pctOf} />
            <StatusTile label="Terminated" value={statusComp.terminated} total={statusTotal} color="text-[var(--muted)]" pctOf={pctOf} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-sm font-extrabold">ถึงเป้า{achieveMetric} เดือนนี้หรือยัง</span>
          </div>
          <AchieveMetricPicker achieveMetric={achieveMetric} />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <StatusTile label="ถึงเป้าแล้ว" value={achieveComp.achieved} total={achieveTotal} color="text-green-700" pctOf={pctOf} />
            <StatusTile label="ยังไม่ถึง" value={achieveComp.missed} total={achieveTotal} color="text-red-600" pctOf={pctOf} />
            <StatusTile label="ยังไม่ตั้งเป้า" value={achieveComp.noTarget} total={achieveTotal} color="text-[var(--muted)]" pctOf={pctOf} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="🗂️" variant="soft" />
          ตารางรายละเอียด
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-xs font-bold text-[var(--muted)]">
              <th className="py-1.5">ช่วงเวลา</th>
              <th className="py-1.5 text-right">{METRIC_LABEL[metric]}</th>
              <th className="py-1.5 text-right">% เปลี่ยนแปลง</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, idx) => {
              const v = values[idx];
              const prevV = idx > 0 ? values[idx - 1] : null;
              const change = prevV !== null && prevV > 0 ? ((v - prevV) / prevV) * 100 : null;
              const label = granularity === "month" ? `${MONTHS_TH[p.m - 1]} ${p.y + 543}` : (p.y + 543).toString();
              const cls = change === null ? "text-[var(--muted)]" : change > 0.5 ? "text-green-700" : change < -0.5 ? "text-red-600" : "text-[var(--muted)]";
              const chipText = change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
              return (
                <tr key={idx} className="border-b border-[var(--line)]">
                  <td className="py-1.5">{label}</td>
                  <td className="py-1.5 text-right font-bold">{fmt(v)}</td>
                  <td className={`py-1.5 text-right font-bold ${cls}`}>{chipText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ChangeBadge({ label, change }: { label: string; change: number | null }) {
  if (change === null) {
    return (
      <Card>
        <div className="text-xs font-bold text-[var(--muted)]">{label}</div>
        <div className="text-lg font-extrabold">—</div>
        <div className="text-xs text-[var(--muted)]">ไม่มีข้อมูลเทียบ</div>
      </Card>
    );
  }
  const pos = change > 0.5;
  const neg = change < -0.5;
  return (
    <Card>
      <div className="text-xs font-bold text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-extrabold ${pos ? "text-green-700" : neg ? "text-red-600" : "text-[var(--muted)]"}`}>
        {change > 0 ? "+" : ""}
        {change.toFixed(1)}%
      </div>
      <div className="text-xs font-bold">{pos ? "▲ เพิ่มขึ้น" : neg ? "▼ ลดลง" : "● คงที่"}</div>
    </Card>
  );
}

function SubBadge({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <div className="text-xs font-bold text-[var(--muted)]">{label}</div>
      <div className="text-lg font-extrabold text-[var(--navy)]">{value}</div>
      <div className="text-xs text-[var(--muted)]">{sub}</div>
    </Card>
  );
}

function StatusTile({ label, value, total, color, pctOf }: { label: string; value: number; total: number; color: string; pctOf: (v: number, t: number) => string }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] p-2">
      <div className="text-[10px] font-bold text-[var(--muted)]">{label}</div>
      <div className={`text-sm font-extrabold ${color}`}>
        {value}
        {pctOf(value, total)}
      </div>
    </div>
  );
}
