"use client";

import { useActionState } from "react";
import { setActualAction } from "@/app/actions/actuals";
import { Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

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
          <input name="actualFYP" type="number" min={0} step="0.01" defaultValue={actual?.actualFYP ?? 0} className={inputClass} />
        </Field>
        <Field label="Actual NBC">
          <input name="actualNBC" type="number" min={0} step="0.01" defaultValue={actual?.actualNBC ?? 0} className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Actual FYC">
          <input name="actualFYC" type="number" min={0} step="0.01" defaultValue={actual?.actualFYC ?? 0} className={inputClass} />
        </Field>
        <Field label="Actual RYC">
          <input name="actualRYC" type="number" min={0} step="0.01" defaultValue={actual?.actualRYC ?? 0} className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Persistency (%)" hint="13-Month Year Block">
          <input name="persistency" type="number" min={0} max={100} step="0.1" defaultValue={actual ? actual.persistency * 100 : 0} className={inputClass} />
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
          <input name="priorYearNBC" type="number" min={0} step="0.01" defaultValue={actual?.priorYearNBC ?? 0} className={inputClass} />
        </Field>
      )}
      {!isAgOrAgentRole && (
        <>
          <Field label="NBC หน่วยตรง (เดือนนี้)" hint="ผลงานส่วนตัว ไม่รวมทีม — ใช้ตรวจสอบเกณฑ์ ODI">
            <input name="personalUnitNBC" type="number" min={0} step="0.01" defaultValue={actual?.personalUnitNBC ?? 0} className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="จำนวน AL ใหม่ที่ปั้นขึ้นเดือนนี้">
              <input name="newALPromotions" type="number" min={0} defaultValue={actual?.newALPromotions ?? 0} className={inputClass} />
            </Field>
            <Field label="จำนวน VP ใหม่ที่ปั้นขึ้นเดือนนี้">
              <input name="newVPPromotions" type="number" min={0} defaultValue={actual?.newVPPromotions ?? 0} className={inputClass} />
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
