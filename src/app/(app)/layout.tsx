import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/dashboard", label: "ภาพรวม" },
  { href: "/team", label: "จัดการทีม" },
  { href: "/goals", label: "กำหนดเป้าหมาย" },
  { href: "/actuals", label: "บันทึกผลการดำเนินงาน" },
  { href: "/income", label: "ประมาณการรายได้" },
  { href: "/alerts", label: "การแจ้งเตือนความเสี่ยง" },
  { href: "/settings", label: "ตั้งค่าระบบ", adminOnly: true },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[var(--navy)] text-white shadow">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-[var(--orange)] text-xs font-extrabold">PT</div>
            <span className="font-extrabold">PRIME TEAM</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-white/80">
              {member.name} {member.isAdmin && <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">ADMIN</span>}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.filter((n) => !n.adminOnly || member.isAdmin).map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold text-white/85 hover:bg-white/10 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
