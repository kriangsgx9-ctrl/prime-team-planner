"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBadge } from "@/components/ui/primitives";
import { useSidebar } from "./SidebarContext";

type NavItem = { href: string; icon: string; label: string; adminOnly?: boolean };
type NavGroup = { title: string | null; items: NavItem[] };

// One unified list for both the mobile slide-out drawer and the desktop
// sidebar, grouped to mirror the app's actual workflow (plan -> track ->
// manage the team -> system/data) — ported from the offline app's NAV_GROUPS.
const NAV_GROUPS: NavGroup[] = [
  { title: null, items: [{ href: "/dashboard", icon: "🏠", label: "ภาพรวมผลงาน" }] },
  {
    title: "วางแผนและผลงาน",
    items: [
      { href: "/goals", icon: "🎯", label: "กำหนดเป้าหมาย" },
      { href: "/actuals", icon: "✏️", label: "บันทึกผลการดำเนินงาน" },
      { href: "/income", icon: "🧮", label: "ประมาณการรายได้" },
      { href: "/trends", icon: "📊", label: "แนวโน้มผลงาน" },
    ],
  },
  {
    title: "ทีมงาน",
    items: [
      { href: "/team", icon: "🧑‍🤝‍🧑", label: "จัดการทีมงาน" },
      { href: "/eval", icon: "📝", label: "ประเมินผลการปฏิบัติงาน" },
      { href: "/qualtrack", icon: "🏆", label: "ติดตามคุณวุฒิ" },
      { href: "/team-report", icon: "🗂️", label: "รายงานสรุปทีม" },
    ],
  },
  {
    title: "ระบบและข้อมูล",
    items: [
      { href: "/alerts", icon: "🚨", label: "การแจ้งเตือน" },
      { href: "/settings", icon: "⚙️", label: "ตั้งค่าระบบ", adminOnly: true },
      { href: "/export", icon: "📤", label: "นำเข้า-ส่งออกข้อมูล" },
    ],
  },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[190] bg-[rgba(6,27,62,0.55)] transition-opacity md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <nav
        className={`fixed inset-y-0 left-0 z-[200] flex w-[260px] max-w-[80vw] flex-col bg-[var(--navy-dark)] shadow-[4px_0_24px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out md:static md:w-[220px] md:max-w-none md:shrink-0 md:translate-x-0 md:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between px-3.5 pt-3.5 pb-3 md:hidden">
          <span className="text-[13px] font-extrabold text-white">เมนู</span>
          <button type="button" onClick={() => setOpen(false)} className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-white/10 text-sm text-white">
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5 pt-0 md:overflow-visible md:pt-3.5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && <div className={`px-2 pb-1.5 text-[10px] font-extrabold tracking-wide text-[#5E6C92] uppercase ${gi === 0 ? "mt-0.5" : "mt-4"}`}>{group.title}</div>}
              {group.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors ${isActive ? "bg-[rgba(255,106,0,0.18)] text-white" : "text-[#93A2C4] hover:bg-white/[0.06] hover:text-white"}`}
                    >
                      <IconBadge
                        icon={item.icon}
                        size="sm"
                        className={`mr-0 ${isActive ? "bg-gradient-to-br from-[var(--orange)] to-[var(--orange-cta)] text-white shadow-[0_2px_8px_rgba(255,106,0,0.35)]" : "bg-white/[0.07] text-inherit"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
