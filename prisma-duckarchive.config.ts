import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "node_modules/@duckarchive/prisma/prisma/duckarchive/schema.prisma",
  datasource: {
    url: env("DUCKARCHIVE_DATABASE_URL"),
  },
});
