import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionMember } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ — PRIME TEAM" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  const member = await getSessionMember();
  if (member) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-[var(--orange)] text-lg font-extrabold text-white">PT</div>
        <h1 className="text-xl font-extrabold text-[var(--navy)]">PRIME TEAM</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Goal Setting & Income Planner</p>
      </div>
      <LoginForm notice={reason === "other-device" ? "บัญชีนี้ถูกเข้าใช้งานจากอุปกรณ์อื่น หรือถูกรีเซ็ตโดยแอดมิน — 1 บัญชีใช้ได้ครั้งละ 1 คน" : undefined} />
    </main>
  );
}
