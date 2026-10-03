"use client";

import { useActionState } from "react";
import { setGoalAction } from "@/app/actions/goals";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

export function GoalForm({ memberId, year, month, goal }: { memberId: string; year: number; month: number; goal: { targetFYP: number; targetNBC: number; targetFYC: number } | null }) {
  const [state, action, pending] = useActionState(setGoalAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="เป้าหมาย FYP (บาท)">
          <input name="targetFYP" type="number" min={0} step="0.01" defaultValue={goal?.targetFYP ?? 0} className={inputClass} />
        </Field>
        <Field label="เป้าหมาย NBC">
          <input name="targetNBC" type="number" min={0} step="0.01" defaultValue={goal?.targetNBC ?? 0} className={inputClass} />
        </Field>
        <Field label="เป้าหมาย FYC">
          <input name="targetFYC" type="number" min={0} step="0.01" defaultValue={goal?.targetFYC ?? 0} className={inputClass} />
        </Field>
      </div>
      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </PrimeButton>
    </form>
  );
}
