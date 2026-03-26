import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "node_modules/@duckarchive/prisma/prisma/duckkey/schema.prisma",
  datasource: {
    url: env("DUCKKEY_DATABASE_URL"),
  },
});
