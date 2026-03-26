import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "node_modules/@duckarchive/prisma/prisma/duckarchive/schema.prisma",
  migrations: {
    path: "prisma/duckarchive/migrations",
    seed: "tsup prisma/duckarchive/seed.ts",
  },
  datasource: {
    url: env("DUCKARCHIVE_DATABASE_URL"),
  },
});
