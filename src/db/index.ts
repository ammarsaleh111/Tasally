import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database Client Configuration
 * 
 * Optimized for serverless (Vercel/Netlify) with Neon Postgres:
 * - Uses pooled connection string when available (DATABASE_POOL_URL)
 * - Falls back to direct connection (DATABASE_URL)
 * - Global singleton prevents connection exhaustion
 * - Low max connections suitable for serverless cold starts
 */

// Prefer pooled connection (PgBouncer) for serverless
const connectionString = (
  process.env.DATABASE_POOL_URL?.trim() || 
  process.env.DATABASE_URL?.trim()
);

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_POOL_URL is not set. Please configure your environment.");
}

// Detect if using pooled connection (Neon pooler uses port 5432 or has -pooler in host)
const isPooled = connectionString.includes('-pooler') || connectionString.includes(':6543');

declare global {
  // eslint-disable-next-line no-var
  var __drizzleClient: ReturnType<typeof postgres> | undefined;
}

// Connection options optimized for serverless
const connectionOptions: postgres.Options<{}> = {
  // Low max for serverless - each instance gets few connections
  // Neon pooler handles the actual pooling
  max: isPooled ? 5 : 1,
  // Disable prepare for transaction pooling mode (Neon default)
  prepare: !isPooled,
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  // Connection timeout
  connect_timeout: 10,
  // Idle timeout - close idle connections quickly in serverless
  idle_timeout: 20,
  // Max lifetime to prevent stale connections
  max_lifetime: 60 * 30, // 30 minutes
};

// Global singleton - reused across requests in same serverless instance
const client = global.__drizzleClient ?? postgres(connectionString, connectionOptions);

// In development, persist client across hot reloads
if (process.env.NODE_ENV !== "production") {
  global.__drizzleClient = client;
}

// Always use global in production serverless too
if (process.env.NODE_ENV === "production" && typeof global !== 'undefined') {
  global.__drizzleClient = client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
