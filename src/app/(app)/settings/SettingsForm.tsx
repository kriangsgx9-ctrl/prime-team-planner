"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/settings";
import type { SettingsData, Tier } from "@/lib/domain/income";
import { ORG_ROLES, ROLE_LABEL } from "@/lib/domain/org";
import { Card, Field, FormError, inputClass, PrimeButton } from "@/components/ui/primitives";

const TIER_TABLES: Array<{ key: keyof SettingsData; label: string; unit: string }> = [
  { key: "persistencyModifierTiers", label: "Persistency Modifier (ใช้ร่วมทุกตำแหน่ง)", unit: "Persistency ≥ (%)" },
  { key: "renewalBonusModifierTiers", label: "Renewal Bonus Modifier", unit: "Persistency ≥ (%)" },
  { key: "qbTiers", label: "AG — Quarterly Bonus (QB)", unit: "NBC ไตรมาส" },
  { key: "abTiers", label: "AG — Annual Bonus (AB)", unit: "NBC ปี" },
  { key: "alOverridingTiers", label: "AL (UM–SDM) — Monthly Overriding", unit: "Team NBC" },
  { key: "alQBTiers", label: "AL — Quarterly Bonus (QB)", unit: "Team NBC ไตรมาส" },
  { key: "alABTiers", label: "AL — Annual Bonus (AB)", unit: "Team NBC ปี" },
  { key: "vpOverridingTiers", label: "VP — Monthly Overriding", unit: "NBC รวม" },
  { key: "vpQBTiers", label: "VP — Quarterly Bonus (QB)", unit: "NBC รวมไตรมาส" },
  { key: "vpABTiers", label: "VP — Annual Bonus (AB)", unit: "NBC รวมปี" },
  { key: "agpOverridingTiers", label: "AGP — Monthly Overriding", unit: "NBC รวม" },
  { key: "agpQBTiers", label: "AGP — Quarterly Bonus (QB)", unit: "NBC รวมไตรมาส" },
  { key: "agpABTiers", label: "AGP — Annual Bonus (AB)", unit: "NBC รวมปี" },
];

const SCALAR_FIELDS: Array<{ key: keyof SettingsData; label: string; isPct?: boolean }> = [
  { key: "odiChildRateAL", label: "AL — ODI หน่วยลูก (%)", isPct: true },
  { key: "odiGrandchildRateAL", label: "AL — ODI หน่วยหลาน (%)", isPct: true },
  { key: "roRateAL", label: "AL — Renewal Overriding (%)", isPct: true },
  { key: "odiChildRateVP", label: "VP — ODI กลุ่มลูก (%)", isPct: true },
  { key: "odiGrandchildRateVP", label: "VP — ODI กลุ่มหลาน (%)", isPct: true },
  { key: "roRateVP", label: "VP — Renewal Overriding (%)", isPct: true },
  { key: "odiChildRateAGP", label: "AGP — ODI กลุ่มลูก (%)", isPct: true },
  { key: "roRateAGP", label: "AGP — Renewal Overriding (%)", isPct: true },
  { key: "structureExtBonusAmount", label: "Structure Extension Bonus (บาท/คน)" },
  { key: "raThreshold", label: "RA — เกณฑ์ NBC ไตรมาสของผู้ชักชวน" },
  { key: "raRate", label: "RA — อัตรา (%)", isPct: true },
  { key: "raMonths", label: "RA — จ่ายกี่เดือน" },
  { key: "raNewAgentNBCThreshold", label: "RA — เกณฑ์ NBC สะสมของตัวแทนใหม่" },
];

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const [state, action, pending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={action} className="space-y-4">
      {TIER_TABLES.map(({ key, label, unit }) => (
        <Card key={key}>
          <h2 className="mb-3 text-sm font-extrabold text-[var(--navy)]">{label}</h2>
          <div className="space-y-2">
            {(settings[key] as Tier[]).map((t, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Field label={`ขั้น ${i + 1} — ${unit} ตั้งแต่`}>
                  <input name={`tier_${key}_${i}_min`} type="number" step="0.01" defaultValue={t.min} className={inputClass} />
                </Field>
                <Field label="อัตรา (%)">
                  <input name={`tier_${key}_${i}_rate`} type="number" step="0.0001" defaultValue={+(t.rate * 100).toFixed(4)} className={inputClass} />
                </Field>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <h2 className="mb-3 text-sm font-extrabold text-[var(--navy)]">อัตราอื่น ๆ (ODI / Renewal Overriding / RA / Structure Bonus)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCALAR_FIELDS.map(({ key, label, isPct }) => (
            <Field key={key} label={label}>
              <input name={key} type="number" step="0.0001" defaultValue={isPct ? +((settings[key] as number) * 100).toFixed(4) : (settings[key] as number)} className={inputClass} />
            </Field>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-extrabold text-[var(--navy)]">เกณฑ์รักษาตำแหน่ง (ประเมินทุกมกราคม)</h2>
        <div className="space-y-3">
          {ORG_ROLES.filter((r) => r !== "AG").map((role) => {
            const c = settings.retentionCriteria[role];
            if (!c) return null;
            return (
              <div key={role} className="grid grid-cols-3 gap-3 border-b border-[var(--line)] pb-3 last:border-0">
                <Field label={`${ROLE_LABEL[role]} — FYC 12 ด.`}>
                  <input name={`retention_${role}_fyc`} type="number" defaultValue={c.fyc} className={inputClass} />
                </Field>
                <Field label="จำนวนตัวแทนขั้นต่ำ">
                  <input name={`retention_${role}_agents`} type="number" defaultValue={c.agents} className={inputClass} />
                </Field>
                <Field label="Persistency ขั้นต่ำ (%)">
                  <input name={`retention_${role}_persistency`} type="number" step="0.1" defaultValue={+(c.persistency * 100).toFixed(1)} className={inputClass} />
                </Field>
              </div>
            );
          })}
        </div>
      </Card>

      <FormError error={state?.error} />
      <PrimeButton type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
      </PrimeButton>
    </form>
  );
}
