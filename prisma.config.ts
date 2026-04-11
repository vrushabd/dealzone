import { defineConfig } from "prisma/config";
import "dotenv/config";

// Supabase: DIRECT_URL for Prisma CLI/migrations; app runtime uses DATABASE_URL (pooler) in src/lib/prisma.ts.
const datasourceUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://localhost:5432/ecommerce";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: datasourceUrl,
  },
});
