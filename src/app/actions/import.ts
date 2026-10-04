"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { actionUser } from "@/lib/auth/session";
import { extractPdfText } from "@/lib/pdf/extract-text";
import { detectReportPeriod, parseTeamReportPdf, verifyAgainstTeamTotal, type TeamTotalMismatch } from "@/lib/import/team-report-pdf";

export type UnmatchedImportRow = { code: string; name: string; month: number; yearBE: number };

export type ActualsMatchedRow = {
  memberId: string;
  memberName: string;
  year: number;
  month: number;
  actualFYP: number;
  actualNBC: number;
  actualFYC: number;
  actualRYC: number;
};

export type GoalsMatchedRow = {
  memberId: string;
  memberName: string;
  year: number;
  month: number;
  targetFYP: number;
  targetNBC: number;
  targetFYC: number;
};

export type PdfMatchedRow = {
  memberId: string;
  memberName: string;
  year: number;
  month: number;
  actualFYP: number;
  actualNBC: number;
  actualFYC: number;
  agentStatus: string;
  active: boolean;
};

type MemberForMatch = { id: string; name: string; agentCode: string | null };

async function loadMembersForMatch(): Promise<MemberForMatch[]> {
  return prisma.member.findMany({ select: { id: true, name: true, agentCode: true } });
}

function findMember(members: MemberForMatch[], code: string, name: string): MemberForMatch | null {
  let m = code ? members.find((u) => u.agentCode && u.agentCode.trim() === code) : undefined;
  if (!m && name) m = members.find((u) => u.name.trim() === name);
  return m ?? null;
}

function cellStr(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v) return String((v as { text?: unknown }).text ?? "").trim();
  if (typeof v === "object" && "result" in v) return String((v as { result?: unknown }).result ?? "").trim();
  return String(v).trim();
}
function cellNum(v: ExcelJS.CellValue): number {
  const n = parseFloat(cellStr(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fileFromForm(formData: FormData): File | null {
  const file = formData.get("file");
  return file instanceof File ? file : null;
}

// ---------------- Excel: Actuals ----------------

export async function previewActualsExcelImport(formData: FormData): Promise<{ matched: ActualsMatchedRow[]; unmatched: UnmatchedImportRow[] } | { error: string }> {
  await actionUser();
  const file = fileFromForm(formData);
  if (!file) return { error: "ไม่พบไฟล์" };

  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exceljs transitively pulls in @types/node@14 via fast-csv, which declares an incompatible ambient Buffer
  await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any);
  const ws = wb.worksheets[0];
  if (!ws) return { error: "ไม่พบชีตข้อมูลในไฟล์" };

  const members = await loadMembersForMatch();
  const matched: ActualsMatchedRow[] = [];
  const unmatched: UnmatchedImportRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const code = cellStr(row.getCell(1).value);
    const name = cellStr(row.getCell(2).value);
    const month = Math.trunc(cellNum(row.getCell(4).value));
    const yearBE = Math.trunc(cellNum(row.getCell(5).value));
    if (!month || month < 1 || month > 12 || !yearBE) return;
    const year = yearBE - 543;
    const member = findMember(members, code, name);
    const data = {
      actualFYP: cellNum(row.getCell(6).value),
      actualNBC: cellNum(row.getCell(7).value),
      actualFYC: cellNum(row.getCell(8).value),
      actualRYC: cellNum(row.getCell(9).value),
    };
    if (member) matched.push({ memberId: member.id, memberName: member.name, year, month, ...data });
    else unmatched.push({ code, name, month, yearBE });
  });

  return { matched, unmatched };
}

export async function commitActualsImport(rows: ActualsMatchedRow[]): Promise<{ ok: true; count: number } | { error: string }> {
  await actionUser();
  if (!rows.length) return { error: "ไม่มีรายการให้นำเข้า" };
  await prisma.$transaction(
    rows.map((r) =>
      prisma.actual.upsert({
        where: { memberId_year_month: { memberId: r.memberId, year: r.year, month: r.month } },
        update: { actualFYP: r.actualFYP, actualNBC: r.actualNBC, actualFYC: r.actualFYC, actualRYC: r.actualRYC },
        create: { memberId: r.memberId, year: r.year, month: r.month, actualFYP: r.actualFYP, actualNBC: r.actualNBC, actualFYC: r.actualFYC, actualRYC: r.actualRYC },
      })
    )
  );
  revalidatePath("/actuals");
  revalidatePath("/income");
  return { ok: true, count: rows.length };
}

// ---------------- Excel: Goals ----------------

export async function previewGoalsExcelImport(formData: FormData): Promise<{ matched: GoalsMatchedRow[]; unmatched: UnmatchedImportRow[] } | { error: string }> {
  await actionUser();
  const file = fileFromForm(formData);
  if (!file) return { error: "ไม่พบไฟล์" };

  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exceljs transitively pulls in @types/node@14 via fast-csv, which declares an incompatible ambient Buffer
  await wb.xlsx.load(Buffer.from(await file.arrayBuffer()) as any);
  const ws = wb.worksheets[0];
  if (!ws) return { error: "ไม่พบชีตข้อมูลในไฟล์" };

  const members = await loadMembersForMatch();
  const matched: GoalsMatchedRow[] = [];
  const unmatched: UnmatchedImportRow[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const code = cellStr(row.getCell(1).value);
    const name = cellStr(row.getCell(2).value);
    const month = Math.trunc(cellNum(row.getCell(4).value));
    const yearBE = Math.trunc(cellNum(row.getCell(5).value));
    if (!month || month < 1 || month > 12 || !yearBE) return;
    const year = yearBE - 543;
    const targetFYP = cellNum(row.getCell(6).value);
    const targetNBC = cellNum(row.getCell(7).value);
    const targetFYC = cellNum(row.getCell(8).value);
    if (targetFYP === 0 && targetNBC === 0 && targetFYC === 0) return;
    const member = findMember(members, code, name);
    if (member) matched.push({ memberId: member.id, memberName: member.name, year, month, targetFYP, targetNBC, targetFYC });
    else unmatched.push({ code, name, month, yearBE });
  });

  return { matched, unmatched };
}

export async function commitGoalsImport(rows: GoalsMatchedRow[]): Promise<{ ok: true; count: number } | { error: string }> {
  await actionUser();
  if (!rows.length) return { error: "ไม่มีรายการให้นำเข้า" };
  await prisma.$transaction(
    rows.map((r) =>
      prisma.goal.upsert({
        where: { memberId_year_month: { memberId: r.memberId, year: r.year, month: r.month } },
        update: { targetFYP: r.targetFYP, targetNBC: r.targetNBC, targetFYC: r.targetFYC },
        create: { memberId: r.memberId, year: r.year, month: r.month, targetFYP: r.targetFYP, targetNBC: r.targetNBC, targetFYC: r.targetFYC },
      })
    )
  );
  revalidatePath("/goals");
  return { ok: true, count: rows.length };
}

// ---------------- PDF: Actuals (FWD team report) ----------------

export type PdfImportPreview = {
  matched: PdfMatchedRow[];
  unmatchedAgents: { name: string; agentCode: string | null }[];
  detectedMonths: number[];
  period: { month: number; yearBE: number } | null;
  mismatches: TeamTotalMismatch[] | null;
  yearBE: number;
};

export async function previewActualsPdfImport(formData: FormData): Promise<PdfImportPreview | { error: string }> {
  await actionUser();
  const file = fileFromForm(formData);
  if (!file) return { error: "ไม่พบไฟล์" };
  const yearBEInput = Number(formData.get("yearBE")) || 0;

  let text: string;
  try {
    text = await extractPdfText(Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error("extractPdfText failed:", err);
    return { error: "อ่านไฟล์ PDF ไม่สำเร็จ (ไฟล์อาจเสียหายหรือไม่ใช่ PDF ข้อความ)" };
  }

  const report = parseTeamReportPdf(text);
  if (!report.agents.length) return { error: "อ่านไฟล์ได้ แต่ไม่พบโครงสร้างรายงานผลงานที่รู้จัก (ต้องเป็นรายงาน FWD Sale Performance)" };

  const period = detectReportPeriod(text);
  const yearBE = period?.yearBE || yearBEInput || new Date().getFullYear() + 543;
  const year = yearBE - 543;

  const members = await loadMembersForMatch();
  const matched: PdfMatchedRow[] = [];
  const unmatchedAgents: { name: string; agentCode: string | null }[] = [];

  for (const ag of report.agents) {
    const member = ag.agentCode ? members.find((u) => u.agentCode && u.agentCode.trim() === ag.agentCode) : undefined;
    if (!member) {
      unmatchedAgents.push({ name: ag.name, agentCode: ag.agentCode });
      continue;
    }
    const statusText = ag.status ? ag.status.toUpperCase() : "ACTIVE";
    const isActive = statusText === "ACTIVE";
    const n = ag.fyp.length;
    for (let idx = 0; idx < n; idx++) {
      const fyp = ag.fyp[idx] || 0;
      const fyc = ag.fyc[idx] || 0;
      const nbc = ag.nbcfy[idx] || 0;
      const isLastMonth = idx === n - 1;
      if (fyp === 0 && fyc === 0 && nbc === 0 && !isLastMonth) continue; // skip empty EARLIER months only
      const monthNum = ag.months[idx] ?? idx + 1;
      matched.push({ memberId: member.id, memberName: member.name, year, month: monthNum, actualFYP: fyp, actualFYC: fyc, actualNBC: nbc, agentStatus: statusText, active: isActive });
    }
  }

  const detectedMonths = report.agents.find((a) => a.months.length)?.months ?? [];
  const mismatches = verifyAgainstTeamTotal(report);

  return { matched, unmatchedAgents, detectedMonths, period, mismatches, yearBE };
}

export async function commitActualsPdfImport(rows: PdfMatchedRow[]): Promise<{ ok: true; count: number } | { error: string }> {
  await actionUser();
  if (!rows.length) return { error: "ไม่มีรายการให้นำเข้า" };
  await prisma.$transaction(
    rows.map((r) =>
      prisma.actual.upsert({
        where: { memberId_year_month: { memberId: r.memberId, year: r.year, month: r.month } },
        update: { actualFYP: r.actualFYP, actualNBC: r.actualNBC, actualFYC: r.actualFYC, agentStatus: r.agentStatus, active: r.active },
        create: { memberId: r.memberId, year: r.year, month: r.month, actualFYP: r.actualFYP, actualNBC: r.actualNBC, actualFYC: r.actualFYC, agentStatus: r.agentStatus, active: r.active },
      })
    )
  );
  revalidatePath("/actuals");
  revalidatePath("/income");
  return { ok: true, count: rows.length };
}
