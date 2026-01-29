import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { resolve } from "path";

// Ensure DATABASE_URL is available for CLI commands like `drizzle-kit migrate`
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-process-env
  require("dotenv").config({ path: resolve(process.cwd(), ".env.local") });
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
