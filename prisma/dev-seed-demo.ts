// Throwaway dev-only seed for manually verifying Phase 3 features (Team
// Report, Trends, Qualification Tracking, Evaluations, Org Chart, Export)
// against a realistic small org with a few months of history. Not run in
// production (no package.json script wired to it on purpose).
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const admin = await prisma.member.findFirst({ where: { isAdmin: true } });
  if (!admin) throw new Error("No admin found — run /setup first.");

  const vp = await prisma.member.create({ data: { name: "คุณวิภา VP", role: "VP", parentId: admin.id } });
  const um = await prisma.member.create({ data: { name: "คุณมณี UM", role: "UM", parentId: vp.id } });
  const ag1 = await prisma.member.create({ data: { name: "เก่ง ใจดี", role: "AG", parentId: um.id, joinMonth: 1, joinYear: 2025 } });
  const ag2 = await prisma.member.create({ data: { name: "แนน สายบุญ", role: "AG", parentId: um.id, joinMonth: 3, joinYear: 2026 } });

  const year = 2026;
  for (let m = 7; m <= 10; m++) {
    const variance = 0.8 + 0.1 * (m - 7);
    await prisma.goal.upsert({
      where: { memberId_year_month: { memberId: ag1.id, year, month: m } },
      update: {},
      create: { memberId: ag1.id, year, month: m, targetFYP: 50000, targetNBC: 10, targetFYC: 15000 },
    });
    await prisma.actual.upsert({
      where: { memberId_year_month: { memberId: ag1.id, year, month: m } },
      update: {},
      create: {
        memberId: ag1.id, year, month: m,
        actualFYP: Math.round(50000 * variance), actualNBC: Math.round(10 * variance),
        actualFYC: Math.round(15000 * variance), actualRYC: 2000,
        persistency: 0.85, active: true, agentStatus: "ACTIVE",
      },
    });
    await prisma.goal.upsert({
      where: { memberId_year_month: { memberId: ag2.id, year, month: m } },
      update: {},
      create: { memberId: ag2.id, year, month: m, targetFYP: 40000, targetNBC: 8, targetFYC: 12000 },
    });
    await prisma.actual.upsert({
      where: { memberId_year_month: { memberId: ag2.id, year, month: m } },
      update: {},
      create: {
        memberId: ag2.id, year, month: m,
        actualFYP: Math.round(40000 * variance * 0.9), actualNBC: Math.round(8 * variance * 0.9),
        actualFYC: Math.round(12000 * variance * 0.9), actualRYC: 1500,
        persistency: 0.78, active: true, agentStatus: "ACTIVE",
      },
    });
    await prisma.actual.upsert({
      where: { memberId_year_month: { memberId: um.id, year, month: m } },
      update: {},
      create: { memberId: um.id, year, month: m, actualFYP: 20000, actualNBC: 5, actualFYC: 8000, actualRYC: 500, persistency: 0.82, active: true, agentStatus: "ACTIVE", personalUnitNBC: 5 },
    });
    await prisma.actual.upsert({
      where: { memberId_year_month: { memberId: vp.id, year, month: m } },
      update: {},
      create: { memberId: vp.id, year, month: m, actualFYP: 10000, actualNBC: 2, actualFYC: 4000, actualRYC: 300, persistency: 0.9, active: true, agentStatus: "ACTIVE", personalUnitNBC: 2 },
    });
  }

  await prisma.qualification.createMany({
    data: [
      { icon: "🏆", name: "Top Producer เดือนนี้", scope: "ALL", metric: "actualNBC", threshold: 8 },
      { icon: "💎", name: "MDRT Pace (NBC สะสมปี)", scope: "AG", metric: "annualNBC", threshold: 30 },
    ],
  });

  console.log("Seeded demo org:", { vp: vp.id, um: um.id, ag1: ag1.id, ag2: ag2.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
