"use client";

import { useActionState } from "react";
import { setGoalAction } from "@/app/actions/goals";
import { Field, FormError, PrimeButton } from "@/components/ui/primitives";
import { NumberInput } from "@/components/ui/NumberInput";

export function GoalForm({ memberId, year, month, goal }: { memberId: string; year: number; month: number; goal: { targetFYP: number; targetNBC: number; targetFYC: number } | null }) {
  const [state, action, pending] = useActionState(setGoalAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="เป้าหมาย FYP (บาท)">
          <NumberInput name="targetFYP" min={0} step="0.01" defaultValue={goal?.targetFYP ?? 0} unit="บาท" />
        </Field>
        <Field label="เป้าหมาย NBC">
          <NumberInput name="targetNBC" min={0} step="0.01" defaultValue={goal?.targetNBC ?? 0} />
        </Field>
        <Field label="เป้าหมาย FYC">
          <NumberInput name="targetFYC" min={0} step="0.01" defaultValue={goal?.targetFYC ?? 0} unit="บาท" />
        </Field>
      </div>
      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </PrimeButton>
    </form>
  );
}
