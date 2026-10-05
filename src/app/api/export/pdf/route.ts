import PDFDocument from "pdfkit";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { rolesOrder } from "@/lib/domain/org";
import { computeIncome, fmt, getActual, getGoal } from "@/lib/domain/income";
import { loadIncomeContext } from "@/lib/services/income-context";
import { NOTO_SANS_THAI_BOLD_BASE64, NOTO_SANS_THAI_REGULAR_BASE64 } from "@/lib/fonts/noto-sans-thai";
import { PRIME_LOGO_PNG_BASE64 } from "@/lib/assets/prime-logo";

export const runtime = "nodejs";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// pdfkit's built-in fonts (Helvetica) can't render Thai glyphs — ship a Thai
// font instead (Noto Sans Thai, OFL-licensed), embedded as base64 in the JS
// bundle rather than read from disk or fetched over HTTP: process.cwd() isn't
// reliably the project root under every way this app gets launched, and a
// self-fetch back to the same dev server returned a truncated/garbled body
// in testing (likely a Turbopack static-file-serving quirk for non-browser
// clients) — the bundled constant sidesteps both failure modes entirely.
function loadThaiFont(doc: PDFKit.PDFDocument) {
  doc.registerFont("Thai", Buffer.from(NOTO_SANS_THAI_REGULAR_BASE64, "base64"));
  doc.registerFont("Thai-Bold", Buffer.from(NOTO_SANS_THAI_BOLD_BASE64, "base64"));
}

export async function GET(request: NextRequest) {
  await requireUser();

  const sp = request.nextUrl.searchParams;
  const now = new Date();
  const year = sp.get("year") ? Number(sp.get("year")) : now.getFullYear();
  const month = sp.get("month") ? Number(sp.get("month")) : now.getMonth() + 1;

  const members = await prisma.member.findMany({ orderBy: { createdAt: "asc" } });
  const sorted = [...members].sort((a, b) => rolesOrder(a.role as never) - rolesOrder(b.role as never));
  const ctx = await loadIncomeContext(year);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  loadThaiFont(doc);
  doc.font("Thai");

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.image(Buffer.from(PRIME_LOGO_PNG_BASE64, "base64"), 40, 36, { width: 42, height: 42 });
  doc.font("Thai-Bold").fontSize(18).text("PRIME TEAM — รายงานผลงานทีม", { align: "center" });
  doc.font("Thai").fontSize(11).fillColor("#6B7488").text(`เดือน ${MONTHS_TH[month - 1]} ${year + 543}`, { align: "center" });
  doc.moveDown(1.2);

  const colX = { name: 40, role: 200, targetFYP: 250, actualFYP: 320, targetNBC: 390, actualNBC: 450, income: 500 };
  const headerY = doc.y;
  doc.font("Thai-Bold").fontSize(9).fillColor("#0A2A5E");
  doc.text("ชื่อ", colX.name, headerY, { width: 155 });
  doc.text("ตำแหน่ง", colX.role, headerY, { width: 45 });
  doc.text("เป้า FYP", colX.targetFYP, headerY, { width: 65, align: "right" });
  doc.text("จริง FYP", colX.actualFYP, headerY, { width: 65, align: "right" });
  doc.text("เป้า NBC", colX.targetNBC, headerY, { width: 55, align: "right" });
  doc.text("จริง NBC", colX.actualNBC, headerY, { width: 55, align: "right" });
  doc.text("รายได้", colX.income, headerY, { width: 70, align: "right" });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor("#E7EAF2").stroke();
  doc.moveDown(0.3);

  let total = 0;
  for (const m of sorted) {
    const goal = getGoal(ctx, m.id, year, month);
    const actual = getActual(ctx, m.id, year, month);
    const income = computeIncome(ctx, m.id, year, month);
    total += income.total;

    const rowY = doc.y;
    if (rowY > 760) {
      doc.addPage();
      doc.y = 40;
    }
    doc.font("Thai").fontSize(9).fillColor("#1B2233");
    doc.text(m.name, colX.name, doc.y, { width: 155 });
    doc.text(m.role, colX.role, rowY, { width: 45 });
    doc.text(fmt(goal.targetFYP), colX.targetFYP, rowY, { width: 65, align: "right" });
    doc.text(fmt(actual.actualFYP), colX.actualFYP, rowY, { width: 65, align: "right" });
    doc.text(fmt(goal.targetNBC), colX.targetNBC, rowY, { width: 55, align: "right" });
    doc.text(fmt(actual.actualNBC), colX.actualNBC, rowY, { width: 55, align: "right" });
    doc.font("Thai-Bold").fillColor("#D9480F").text(`฿${fmt(income.total)}`, colX.income, rowY, { width: 70, align: "right" });
    doc.moveDown(0.6);
  }

  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor("#E7EAF2").stroke();
  doc.moveDown(0.5);
  doc.font("Thai-Bold").fontSize(11).fillColor("#0A2A5E").text(`รวมรายได้ประมาณการทั้งทีม: ฿${fmt(total)}`, { align: "right" });

  doc.end();
  const buffer = await done;

  const filename = `PRIMETEAM_Report_${year}-${String(month).padStart(2, "0")}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
