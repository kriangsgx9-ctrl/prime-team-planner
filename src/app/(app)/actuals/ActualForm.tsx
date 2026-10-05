"use client";

import { useActionState } from "react";
import { setActualAction } from "@/app/actions/actuals";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";
import { NumberInput } from "@/components/ui/NumberInput";

interface ActualData {
  actualFYP: number;
  actualNBC: number;
  actualFYC: number;
  actualRYC: number;
  priorYearNBC: number;
  personalUnitNBC: number | null;
  persistency: number;
  agentStatus: string | null;
  newALPromotions: number;
  newVPPromotions: number;
}

export function ActualForm({ memberId, year, month, actual, isAgOrAgentRole }: { memberId: string; year: number; month: number; actual: ActualData | null; isAgOrAgentRole: boolean }) {
  const [state, action, pending] = useActionState(setActualAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Actual FYP">
          <NumberInput name="actualFYP" min={0} step="0.01" defaultValue={actual?.actualFYP ?? 0} unit="บาท" />
        </Field>
        <Field label="Actual NBC">
          <NumberInput name="actualNBC" min={0} step="0.01" defaultValue={actual?.actualNBC ?? 0} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Actual FYC">
          <NumberInput name="actualFYC" min={0} step="0.01" defaultValue={actual?.actualFYC ?? 0} unit="บาท" />
        </Field>
        <Field label="Actual RYC">
          <NumberInput name="actualRYC" min={0} step="0.01" defaultValue={actual?.actualRYC ?? 0} unit="บาท" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Persistency (%)" hint="13-Month Year Block">
          <NumberInput name="persistency" min={0} max={100} step="0.1" defaultValue={actual ? actual.persistency * 100 : 0} unit="%" />
        </Field>
        <Field label="สถานะตัวแทน">
          <select name="agentStatus" defaultValue={actual?.agentStatus ?? "ACTIVE"} className={inputClass}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </Field>
      </div>
      {isAgOrAgentRole && (
        <Field label="NBC สะสมปีที่ผ่านมา" hint="ใช้คำนวณ Renewal Year Bonus (RYB)">
          <NumberInput name="priorYearNBC" min={0} step="0.01" defaultValue={actual?.priorYearNBC ?? 0} />
        </Field>
      )}
      {!isAgOrAgentRole && (
        <>
          <Field label="NBC หน่วยตรง (เดือนนี้)" hint="ผลงานส่วนตัว ไม่รวมทีม — ใช้ตรวจสอบเกณฑ์ ODI">
            <NumberInput name="personalUnitNBC" min={0} step="0.01" defaultValue={actual?.personalUnitNBC ?? 0} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="จำนวน AL ใหม่ที่ปั้นขึ้นเดือนนี้">
              <NumberInput name="newALPromotions" min={0} defaultValue={actual?.newALPromotions ?? 0} unit="คน" />
            </Field>
            <Field label="จำนวน VP ใหม่ที่ปั้นขึ้นเดือนนี้">
              <NumberInput name="newVPPromotions" min={0} defaultValue={actual?.newVPPromotions ?? 0} unit="คน" />
            </Field>
          </div>
        </>
      )}
      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึกผลการดำเนินงาน"}
      </PrimeButton>
    </form>
  );
}
