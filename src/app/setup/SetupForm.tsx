"use client";

import { useActionState } from "react";
import { setupAdminAction } from "@/app/actions/setup";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAdminAction, undefined);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <Field label="รหัสตั้งค่า (SETUP_KEY)" hint="ตั้งไว้ในไฟล์ .env ของเซิร์ฟเวอร์">
        <input name="setupKey" type="password" required className={inputClass} />
      </Field>
      <Field label="ชื่อ">
        <input name="name" required maxLength={60} className={inputClass} />
      </Field>
      <Field label="ชื่อผู้ใช้ (Username)" hint="A-Z, 0-9, _ เท่านั้น">
        <input name="username" required maxLength={20} className={`${inputClass} uppercase`} autoCapitalize="characters" />
      </Field>
      <Field label="รหัสผ่าน" hint="อย่างน้อย 8 ตัวอักษร">
        <input name="password" type="password" required minLength={8} className={inputClass} autoComplete="new-password" />
      </Field>
      <FormError error={state?.error} />
      <PrimeButton type="submit" full disabled={pending}>
        {pending ? "กำลังสร้างบัญชี…" : "สร้างบัญชีแอดมิน"}
      </PrimeButton>
    </form>
  );
}
