import { requireAdmin } from "@/lib/auth/session";
import { getSettingsData } from "@/lib/services/income-context";
import { Card, IconBadge } from "@/components/ui/primitives";
import { SettingsForm } from "./SettingsForm";
import { BackupRestore } from "./BackupRestore";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettingsData();

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="flex items-center text-lg font-extrabold text-[var(--navy)]">
          <IconBadge icon="⚙️" variant="navy" />
          ตั้งค่าระบบ
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">ตารางอัตราค่าคอมมิชชัน — เฉพาะแอดมินเท่านั้นที่แก้ไขได้</p>
      </Card>
      <SettingsForm settings={settings} />
      <Card>
        <h2 className="mb-1 flex items-center text-base font-extrabold text-[var(--navy)]">
          <IconBadge icon="💾" variant="navy" />
          สำรองข้อมูลทั้งระบบ (Backup)
        </h2>
        <BackupRestore />
      </Card>
    </div>
  );
}
