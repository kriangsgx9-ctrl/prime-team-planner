import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — PRIME TEAM" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const member = await getSessionMember();
  if (member) redirect("/dashboard");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/images/hero/wave.jpg" alt="" fill priority className="object-cover opacity-[0.08]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white" />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/images/logo.png" alt="PRIME" width={84} height={84} priority className="mx-auto mb-3 rounded-2xl shadow-lg shadow-[var(--navy)]/20" />
          <h1 className="text-xl font-extrabold text-[var(--navy)]">PRIME TEAM</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Goal Setting & Income Planner</p>
        </div>
        <LoginForm notice={reason === "other-device" ? "บัญชีนี้ถูกเข้าใช้งานจากอุปกรณ์อื่น หรือถูกรีเซ็ตโดยแอดมิน — 1 บัญชีใช้ได้ครั้งละ 1 คน" : undefined} />
      </div>
    </main>
  );
}
