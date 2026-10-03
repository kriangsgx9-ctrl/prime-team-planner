import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL ??
      "",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
