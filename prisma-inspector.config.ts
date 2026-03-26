import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "node_modules/@duckarchive/prisma/prisma/inspector/schema.prisma",
  migrations: {
    path: "prisma/inspector/migrations",
    seed: "tsup prisma/inspector/seed.ts",
  },
  datasource: {
    url: env("INSPECTOR_DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
