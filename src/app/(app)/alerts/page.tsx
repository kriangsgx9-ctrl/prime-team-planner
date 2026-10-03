import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { AL_ROLES, descendants, hasActualData } from "@/lib/domain/income";
import { collectAllAlerts } from "@/lib/domain/alerts";
import { loadIncomeContext } from "@/lib/services/income-context";
import { Card } from "@/components/ui/primitives";
import { ScopePicker } from "./ScopePicker";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ scope?: string; year?: string; month?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;
  const scope = sp.scope ?? "ALL";

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const leaders = members.filter((m) => AL_ROLES.includes(m.role as (typeof AL_ROLES)[number]) || m.role === "VP" || m.role === "AGP").sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));

  const ctx = await loadIncomeContext(year);
  const scopeLeader = scope !== "ALL" ? members.find((m) => m.id === scope) : null;
  const scopeIds = scopeLeader ? new Set([scopeLeader.id, ...descendants(ctx, scopeLeader.id).map((d) => d.id)]) : null;

  const allAlerts = collectAllAlerts(ctx, year, month).filter((a) => !scopeIds || scopeIds.has(a.memberId));
  const scopeMembers = scopeLeader ? members.filter((m) => scopeIds!.has(m.id)) : members;

  const membersById = new Map(members.map((m) => [m.id, m]));
  const redCount = allAlerts.filter((a) => a.severity === "red").length;
  const yellowCount = allAlerts.filter((a) => a.severity === "yellow").length;
  const flaggedIds = new Set(allAlerts.map((a) => a.memberId));
  const noDataMembers = scopeMembers.filter((m) => !hasActualData(ctx, m.id, year, month));
  const noDataIds = new Set(noDataMembers.map((m) => m.id));
  const greenCount = scopeMembers.filter((m) => !flaggedIds.has(m.id) && !noDataIds.has(m.id)).length;

  const sorted = [...allAlerts].sort((a, b) => (a.severity === "red" ? 0 : 1) - (b.severity === "red" ? 0 : 1));

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-3 text-lg font-extrabold text-[var(--navy)]">การแจ้งเตือนความเสี่ยง</h1>
        <ScopePicker leaders={leaders} roleLabel={ROLE_LABEL} scope={scope} year={year} month={month} />
      </Card>

      <Card>
        <h2 className="mb-3 text-base font-extrabold">
          สรุปความเสี่ยง{scopeLeader ? ` — ทีมของ ${scopeLeader.name}` : "ทั้งหมด"} — {month}/{year + 543}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="🔴 ไฟแดง" value={redCount} color="text-red-600" />
          <StatTile label="🟡 ไฟเหลือง" value={yellowCount} color="text-amber-600" />
          <StatTile label="✅ ปกติ" value={greenCount} color="text-green-700" />
          <StatTile label="⚪ ยังไม่กรอกข้อมูล" value={noDataMembers.length} color="text-[var(--muted)]" />
        </div>
      </Card>

      {allAlerts.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <div className="mb-2 text-3xl">✅</div>
            <p className="text-sm text-[var(--muted)]">
              ยังไม่พบความเสี่ยงในช่วงเวลานี้{noDataMembers.length > 0 ? ` (มี ${noDataMembers.length} คนยังไม่กรอกข้อมูล)` : ""}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-3 text-base font-extrabold">รายการแจ้งเตือน ({allAlerts.length})</h2>
          <div className="space-y-2">
            {sorted.map((a, idx) => {
              const m = membersById.get(a.memberId);
              return (
                <div key={idx} className={`rounded-xl border-l-4 p-3 ${a.severity === "red" ? "border-red-500 bg-red-50" : "border-amber-400 bg-amber-50"}`}>
                  <div className="text-sm font-extrabold">
                    {a.severity === "red" ? "🔴" : "🟡"} {m?.name} <span className="font-semibold text-[var(--muted)]">· {m ? ROLE_LABEL[m.role as never] : ""}</span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--text)]">
                    <b>{a.title}</b> — {a.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] p-3 text-center">
      <div className="text-xs font-bold text-[var(--muted)]">{label}</div>
      <div className={`text-xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
