import { requireUser } from "@/lib/auth/session";
import { Card, IconBadge } from "@/components/ui/primitives";
import { ImportGoalsExcel } from "@/components/import/ImportGoalsExcel";
import { ActualsImportTabs } from "./ActualsImportTabs";
import { ImportExportTabs } from "./ImportExportTabs";
import { ExportActions } from "./ExportActions";

export default async function ExportPage() {
  await requireUser();

  const importSection = (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="✏️" variant="orange" />
          ผลงาน (Actuals)
        </h2>
        <p className="mb-3 text-sm text-[var(--muted)]">นำเข้า FYP / NBC / FYC ของแต่ละคน — เลือกได้ว่าจะใช้ไฟล์ Excel หรือไฟล์ PDF รายงานจากบริษัท</p>
        <ActualsImportTabs />
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="🎯" variant="navy" />
          เป้าหมาย (Goals)
        </h2>
        <p className="mb-3 text-sm text-[var(--muted)]">นำเข้าเป้า FYP / NBC / FYC ของแต่ละคนจากไฟล์ Excel — รูปแบบเดียวกับการนำเข้าผลงาน</p>
        <ImportGoalsExcel />
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="mb-1 flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="📤" variant="orange" />
          นำเข้า-ส่งออกข้อมูล
        </h1>
        <p className="text-sm text-[var(--muted)]">เลือกว่าจะนำเข้าหรือส่งออกข้อมูลด้านล่าง — เดือน/ปีของแต่ละรายการเลือกแยกกันตามจุดที่ใช้งาน</p>
      </Card>

      <ImportExportTabs importSection={importSection} exportSection={<ExportActions />} />
    </div>
  );
}
