import { defineConfig } from "prisma/config";

// On Render/production: env vars are injected by the platform — no dotenv needed.
// Locally: env vars come from .env via Next.js dev server.
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

