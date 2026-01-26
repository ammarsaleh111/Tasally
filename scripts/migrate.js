#!/usr/bin/env node

/**
 * Database Migration Helper
 * Ensures DATABASE_URL is set before running migrations
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set");
  console.log("\n📝 Setup instructions:");
  console.log("1. Copy .env.example to .env.local");
  console.log("2. Add your Neon Postgres connection string to DATABASE_URL");
  console.log("3. Run this script again\n");
  process.exit(1);
}

// Verify it's a valid Postgres URL
if (!DATABASE_URL.startsWith("postgres://") && !DATABASE_URL.startsWith("postgresql://")) {
  console.error("❌ ERROR: DATABASE_URL must be a valid PostgreSQL connection string");
  console.log("Expected format: postgres://user:pass@host:5432/dbname?sslmode=require\n");
  process.exit(1);
}

console.log("✅ DATABASE_URL is set");
console.log("🗄️  Database host:", DATABASE_URL.match(/@([^:]+)/)?.[1] || "unknown");

// Check if drizzle directory exists
const drizzlePath = path.join(__dirname, "drizzle");
const hasMigrations = fs.existsSync(drizzlePath);

if (!hasMigrations) {
  console.log("\n📦 No migrations found. Generating...");
  try {
    execSync("npm run db:generate", { stdio: "inherit" });
    console.log("✅ Migrations generated");
  } catch (error) {
    console.error("❌ Failed to generate migrations");
    process.exit(1);
  }
}

console.log("\n🚀 Applying migrations...");
try {
  execSync("drizzle-kit push:pg", { stdio: "inherit" });
  console.log("\n✅ Migrations applied successfully!");
  console.log("\n📊 Your database is ready. Tables created:");
  console.log("  - users");
  console.log("  - accounts");
  console.log("  - sessions");
  console.log("  - verification_tokens");
  console.log("  - guest_profiles");
  console.log("  - game_results");
  console.log("\n🎉 You can now run: npm run dev");
} catch (error) {
  console.error("\n❌ Failed to apply migrations");
  console.log("\n💡 Troubleshooting:");
  console.log("  - Verify DATABASE_URL is correct");
  console.log("  - Ensure your Neon database is accessible");
  console.log("  - Check your internet connection");
  process.exit(1);
}
