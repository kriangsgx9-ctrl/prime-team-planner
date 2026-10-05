import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

// Full-system backup — ports the offline app's exportFullBackup(), which
// dumped its entire in-memory DB object to a JSON file. A hosted Postgres
// app doesn't need this for durability (Neon already handles that), but an
// admin-downloadable snapshot is still useful for migrating, auditing, or
// restoring after a mistake.
export async function GET() {
  await requireAdmin();

  const [members, goals, actuals, evaluations, qualifications, settings] = await Promise.all([
    prisma.member.findMany(),
    prisma.goal.findMany(),
    prisma.actual.findMany(),
    prisma.evaluation.findMany(),
    prisma.qualification.findMany(),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  const backup = {
    _meta: { app: "PRIME TEAM PLANNER", exportedAt: new Date().toISOString() },
    members,
    goals,
    actuals,
    evaluations,
    qualifications,
    settings,
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="PRIMETEAM_Backup_${dateStr}.json"`,
    },
  });
}
