import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";

// Must check the DB on every request — never prerender (it would stay
// "no admin yet" forever if Next cached this page at build time).
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const hasAdmin = await prisma.member.count({ where: { isAdmin: true } });
  if (hasAdmin) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-[var(--orange)] text-lg font-extrabold text-white">PT</div>
        <h1 className="text-xl font-extrabold text-[var(--navy)]">ตั้งค่าแอดมินคนแรก</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">PRIME TEAM — สร้างบัญชีแอดมินคนแรกของระบบ</p>
      </div>
      <SetupForm />
    </main>
  );
}
