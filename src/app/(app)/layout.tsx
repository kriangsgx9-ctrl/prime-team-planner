import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/app/actions/auth";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { SidebarToggleButton } from "@/components/layout/SidebarToggleButton";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await requireUser();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 bg-[var(--navy)] text-white shadow">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <SidebarToggleButton />
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--orange)] text-xs font-extrabold">PT</div>
              <span className="font-extrabold">PRIME TEAM</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-white/80 sm:inline">
                {member.name} {member.isAdmin && <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">ADMIN</span>}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="rounded-lg bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/20">
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <Sidebar isAdmin={member.isAdmin} />
          <main className="min-w-0 flex-1 px-4 py-6">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
