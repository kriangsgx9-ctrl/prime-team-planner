import { requireUser } from "@/lib/auth/session";
import { Card, PrimeButton } from "@/components/ui/primitives";
import { MonthYearPicker } from "@/components/MonthYearPicker";

export default async function ExportPage({ searchParams }: { searchParams: Promise<{ year?: string; month?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-1 text-lg font-extrabold text-[var(--navy)]">นำเข้า-ส่งออกข้อมูล</h1>
        <p className="mb-3 text-sm text-[var(--muted)]">เลือกเดือน/ปีที่ต้องการ แล้วส่งออกเป็นไฟล์</p>
        <MonthYearPicker action="/export" year={year} month={month} />
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-extrabold text-[var(--navy)]">ส่งออกข้อมูลเป็นไฟล์ Excel</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">จะส่งออกข้อมูลของเดือนที่เลือกสำหรับสมาชิกทุกคน แยกเป็น 3 แท็บ: Performance Report, Goals, Actuals</p>
        <a href={`/api/export/excel?year=${year}&month=${month}`}>
          <PrimeButton type="button">📤 ส่งออกไฟล์ Excel (.xlsx)</PrimeButton>
        </a>
      </Card>

      <Card>
        <h2 className="mb-1 text-base font-extrabold text-[var(--navy)]">ส่งออกรายงานเป็น PDF</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">สรุปผลงานเทียบเป้าหมายและรายได้ประมาณการของทุกคน พร้อมพิมพ์หรือส่งให้ทีม</p>
        <a href={`/api/export/pdf?year=${year}&month=${month}`}>
          <PrimeButton type="button" variant="navy">
            📄 ส่งออกรายงาน PDF
          </PrimeButton>
        </a>
      </Card>
    </div>
  );
}
