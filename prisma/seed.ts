import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { defaultSettingsData } from "../src/lib/domain/default-settings";

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, dataJson: defaultSettingsData as never },
  });
  console.log("Seeded default commission settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
