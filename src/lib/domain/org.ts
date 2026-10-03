import type { OrgRole } from "./income";

export const ROLE_LABEL: Record<OrgRole, string> = {
  AG: "AG (ตัวแทน)",
  UM: "UM",
  AM: "AM",
  DM: "DM",
  SDM: "SDM",
  VP: "VP",
  AGP: "AGP",
};

export const ORG_ROLES: OrgRole[] = ["AG", "UM", "AM", "DM", "SDM", "VP", "AGP"];

export function rolesOrder(r: OrgRole): number {
  return ["AGP", "VP", "SDM", "DM", "AM", "UM", "AG"].indexOf(r);
}
