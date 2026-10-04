import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL, rolesOrder } from "@/lib/domain/org";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export async function GET(request: NextRequest) {
  await requireUser();
  const sp = request.nextUrl.searchParams;
  const now = new Date();
  const year = sp.get("year") ? Number(sp.get("year")) : now.getFullYear();
  const month = sp.get("month") ? Number(sp.get("month")) : now.getMonth() + 1;

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Import Template");
  ws.columns = [
    { header: "รหัสตัวแทน", key: "code", width: 14 },
    { header: "ชื่อ (ใช้ถ้าไม่มีรหัส)", key: "name", width: 26 },
    { header: "ตำแหน่ง", key: "role", width: 10 },
    { header: "เดือน (1-12)", key: "month", width: 12 },
    { header: "ปี (พ.ศ.)", key: "yearBE", width: 10 },
    { header: "Target FYP", key: "fyp", width: 14 },
    { header: "Target NBC", key: "nbc", width: 14 },
    { header: "Target FYC", key: "fyc", width: 14 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const m of sorted) {
    ws.addRow({ code: m.agentCode || "", name: m.name, role: ROLE_LABEL[m.role as never], month, yearBE: year + 543, fyp: "", nbc: "", fyc: "" });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `PRIMETEAM_Goal_Import_Template_${MONTHS_TH[month - 1]}_${year + 543}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
