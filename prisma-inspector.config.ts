import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "node_modules/@duckarchive/prisma/prisma/inspector/schema.prisma",
  datasource: {
    url: env("INSPECTOR_DATABASE_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
