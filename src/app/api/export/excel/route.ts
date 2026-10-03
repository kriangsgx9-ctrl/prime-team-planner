import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";
import { computeIncome, getActual, getGoal } from "@/lib/domain/income";
import { loadIncomeContext } from "@/lib/services/income-context";

export async function GET(request: NextRequest) {
  await requireUser(); // redirects to /login if not signed in

  const sp = request.nextUrl.searchParams;
  const now = new Date();
  const year = sp.get("year") ? Number(sp.get("year")) : now.getFullYear();
  const month = sp.get("month") ? Number(sp.get("month")) : now.getMonth() + 1;

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));
  const ctx = await loadIncomeContext(year);

  const wb = new ExcelJS.Workbook();
  wb.creator = "PRIME TEAM PLANNER";
  wb.created = new Date();

  // --- Performance Report ---
  const perf = wb.addWorksheet("Performance Report");
  perf.columns = [
    { header: "ชื่อ", key: "name", width: 24 },
    { header: "ตำแหน่ง", key: "role", width: 10 },
    { header: "Target FYP", key: "targetFYP", width: 14 },
    { header: "Actual FYP", key: "actualFYP", width: 14 },
    { header: "% FYP", key: "pctFYP", width: 10 },
    { header: "Target NBC", key: "targetNBC", width: 14 },
    { header: "Actual NBC", key: "actualNBC", width: 14 },
    { header: "% NBC", key: "pctNBC", width: 10 },
    { header: "Actual FYC", key: "actualFYC", width: 14 },
    { header: "รายได้ประมาณการ", key: "income", width: 18 },
  ];
  perf.getRow(1).font = { bold: true };
  for (const m of sorted) {
    const goal = getGoal(ctx, m.id, year, month);
    const actual = getActual(ctx, m.id, year, month);
    const income = computeIncome(ctx, m.id, year, month);
    perf.addRow({
      name: m.name,
      role: ROLE_LABEL[m.role as never],
      targetFYP: goal.targetFYP,
      actualFYP: actual.actualFYP,
      pctFYP: goal.targetFYP > 0 ? actual.actualFYP / goal.targetFYP : null,
      targetNBC: goal.targetNBC,
      actualNBC: actual.actualNBC,
      pctNBC: goal.targetNBC > 0 ? actual.actualNBC / goal.targetNBC : null,
      actualFYC: actual.actualFYC,
      income: income.total,
    });
  }
  perf.getColumn("pctFYP").numFmt = "0%";
  perf.getColumn("pctNBC").numFmt = "0%";

  // --- Goals (raw) ---
  const goalsSheet = wb.addWorksheet("Goals");
  goalsSheet.columns = [
    { header: "ชื่อ", key: "name", width: 24 },
    { header: "เดือน", key: "month", width: 8 },
    { header: "ปี (ค.ศ.)", key: "year", width: 10 },
    { header: "Target FYP", key: "targetFYP", width: 14 },
    { header: "Target NBC", key: "targetNBC", width: 14 },
    { header: "Target FYC", key: "targetFYC", width: 14 },
  ];
  goalsSheet.getRow(1).font = { bold: true };
  const membersById = new Map(members.map((m) => [m.id, m]));
  const goalRows = await prisma.goal.findMany({ where: { year, month } });
  for (const g of goalRows) {
    const m = membersById.get(g.memberId);
    if (!m) continue;
    goalsSheet.addRow({ name: m.name, month: g.month, year: g.year, targetFYP: g.targetFYP, targetNBC: g.targetNBC, targetFYC: g.targetFYC });
  }

  // --- Actuals (raw) ---
  const actualsSheet = wb.addWorksheet("Actuals");
  actualsSheet.columns = [
    { header: "ชื่อ", key: "name", width: 24 },
    { header: "เดือน", key: "month", width: 8 },
    { header: "ปี (ค.ศ.)", key: "year", width: 10 },
    { header: "Actual FYP", key: "actualFYP", width: 14 },
    { header: "Actual NBC", key: "actualNBC", width: 14 },
    { header: "Actual FYC", key: "actualFYC", width: 14 },
    { header: "Actual RYC", key: "actualRYC", width: 14 },
    { header: "Persistency", key: "persistency", width: 12 },
    { header: "สถานะ", key: "agentStatus", width: 12 },
  ];
  actualsSheet.getRow(1).font = { bold: true };
  const actualRows = await prisma.actual.findMany({ where: { year, month } });
  for (const a of actualRows) {
    const m = membersById.get(a.memberId);
    if (!m) continue;
    actualsSheet.addRow({ name: m.name, month: a.month, year: a.year, actualFYP: a.actualFYP, actualNBC: a.actualNBC, actualFYC: a.actualFYC, actualRYC: a.actualRYC, persistency: a.persistency, agentStatus: a.agentStatus });
  }
  actualsSheet.getColumn("persistency").numFmt = "0%";

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `PRIMETEAM_Report_${year}-${String(month).padStart(2, "0")}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
