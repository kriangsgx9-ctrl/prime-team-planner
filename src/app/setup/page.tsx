import Image from "next/image";
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/images/hero/wave.jpg" alt="" fill priority className="object-cover opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/images/logo.png" alt="PRIME" width={84} height={84} priority className="mx-auto mb-3 rounded-2xl shadow-lg shadow-[var(--navy)]/20" />
          <h1 className="text-xl font-extrabold text-[var(--navy)]">ตั้งค่าแอดมินคนแรก</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">PRIME TEAM — สร้างบัญชีแอดมินคนแรกของระบบ</p>
        </div>
        <SetupForm />
      </div>
    </main>
  );
}
