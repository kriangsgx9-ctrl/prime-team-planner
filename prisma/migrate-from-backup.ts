// Imports a backup JSON produced by the offline HTML app's existing
// "Export Backup (.json)" feature (exportFullBackup()) into this app's DB.
// Usage: npm run db:migrate-from-backup -- ./PRIMETEAM_Backup_2026-xx-xx.json
import "dotenv/config";
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";

interface BackupUser {
  id: string;
  name: string;
  role: string;
  parentId: string | null;
  recruiterId?: string | null;
  agentCode?: string | null;
  joinMonth?: number | null;
  joinYear?: number | null;
  photo?: string | null;
}

interface Backup {
  users: BackupUser[];
  goals: Record<string, { targetFYP?: number; targetNBC?: number; targetFYC?: number; status?: string }>;
  actuals: Record<string, {
    actualFYP?: number; actualNBC?: number; actualFYC?: number; actualRYC?: number; priorYearNBC?: number;
    persistency?: number; active?: boolean; agentStatus?: string | null; newALPromotions?: number; newVPPromotions?: number;
  }>;
  settings: Record<string, unknown>;
}

// Old keys are `${userId}|${year}-${month}` — userId itself may contain "|"
// only in theory, never in practice (ids are simple slugs), so splitting on
// the LAST "|" before a "year-month" pattern is safe.
function parseKey(key: string): { oldUserId: string; year: number; month: number } {
  const match = key.match(/^(.*)\|(\d+)-(\d+)$/);
  if (!match) throw new Error(`Unrecognized backup key: ${key}`);
  return { oldUserId: match[1], year: Number(match[2]), month: Number(match[3]) };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run db:migrate-from-backup -- <path-to-backup.json>");
    process.exit(1);
  }
  const backup: Backup = JSON.parse(readFileSync(filePath, "utf-8"));

  const oldToNewId = new Map<string, string>();

  for (const u of backup.users) {
    const created = await prisma.member.create({
      data: {
        name: u.name,
        role: u.role as never,
        agentCode: u.agentCode || null,
        joinMonth: u.joinMonth ?? null,
        joinYear: u.joinYear ?? null,
        photo: u.photo || null,
      },
    });
    oldToNewId.set(u.id, created.id);
  }
  console.log(`Created ${oldToNewId.size} members.`);

  for (const u of backup.users) {
    const newId = oldToNewId.get(u.id)!;
    await prisma.member.update({
      where: { id: newId },
      data: {
        parentId: u.parentId ? (oldToNewId.get(u.parentId) ?? null) : null,
        recruiterId: u.recruiterId ? (oldToNewId.get(u.recruiterId) ?? null) : null,
      },
    });
  }
  console.log("Linked parent/recruiter relationships.");

  let goalCount = 0;
  for (const [key, g] of Object.entries(backup.goals ?? {})) {
    const { oldUserId, year, month } = parseKey(key);
    const memberId = oldToNewId.get(oldUserId);
    if (!memberId) continue;
    await prisma.goal.upsert({
      where: { memberId_year_month: { memberId, year, month } },
      update: { targetFYP: g.targetFYP ?? 0, targetNBC: g.targetNBC ?? 0, targetFYC: g.targetFYC ?? 0, status: g.status ?? null },
      create: { memberId, year, month, targetFYP: g.targetFYP ?? 0, targetNBC: g.targetNBC ?? 0, targetFYC: g.targetFYC ?? 0, status: g.status ?? null },
    });
    goalCount++;
  }
  console.log(`Imported ${goalCount} goal rows.`);

  let actualCount = 0;
  for (const [key, a] of Object.entries(backup.actuals ?? {})) {
    const { oldUserId, year, month } = parseKey(key);
    const memberId = oldToNewId.get(oldUserId);
    if (!memberId) continue;
    const data = {
      actualFYP: a.actualFYP ?? 0,
      actualNBC: a.actualNBC ?? 0,
      actualFYC: a.actualFYC ?? 0,
      actualRYC: a.actualRYC ?? 0,
      priorYearNBC: a.priorYearNBC ?? 0,
      persistency: a.persistency ?? 1,
      active: a.active ?? true,
      agentStatus: a.agentStatus ?? null,
      newALPromotions: a.newALPromotions ?? 0,
      newVPPromotions: a.newVPPromotions ?? 0,
    };
    await prisma.actual.upsert({
      where: { memberId_year_month: { memberId, year, month } },
      update: data,
      create: { memberId, year, month, ...data },
    });
    actualCount++;
  }
  console.log(`Imported ${actualCount} actual rows.`);

  if (backup.settings) {
    await prisma.settings.upsert({
      where: { id: 1 },
      update: { dataJson: backup.settings as never },
      create: { id: 1, dataJson: backup.settings as never },
    });
    console.log("Imported commission settings.");
  }

  console.log("\nDone. Every imported member has NO login yet — grant access from /team as the first admin.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
