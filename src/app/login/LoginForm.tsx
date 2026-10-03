"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      {notice && <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{notice}</p>}
      <Field label="ชื่อผู้ใช้ (Username)">
        <input name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required className={`${inputClass} uppercase`} />
      </Field>
      <Field label="รหัสผ่าน">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <FormError error={state?.error} />
      <PrimeButton type="submit" full disabled={pending}>
        {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </PrimeButton>
    </form>
  );
}
