import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database Client Configuration - Scalability Optimized
 * 
 * Optimized for serverless (Netlify) with Neon Postgres:
 * - Uses DATABASE_URL_POOLED (Neon pooler endpoint) for all runtime queries
 * - Falls back to DATABASE_POOL_URL or DATABASE_URL
 * - Global singleton prevents connection exhaustion
 * - Configured for transaction pooling mode (Neon default)
 * 
 * Environment Variables:
 * - DATABASE_URL_POOLED: Neon pooled connection (use for all runtime queries)
 * - DATABASE_URL: Direct connection (use for migrations only)
 * 
 * Connection Limits (for 10k-50k concurrent users):
 * - Serverless function: max 1 connection per instance
 * - Neon pooler handles actual connection pooling
 * - prepare: false required for transaction pooling
 */

// Priority: DATABASE_URL_POOLED > DATABASE_POOL_URL > DATABASE_URL
const connectionString = (
  process.env.DATABASE_URL_POOLED?.trim() ||
  process.env.DATABASE_POOL_URL?.trim() || 
  process.env.DATABASE_URL?.trim()
);

if (!connectionString) {
  throw new Error(
    "Database connection not configured. Set DATABASE_URL_POOLED (recommended) or DATABASE_URL."
  );
}

// Detect if using pooled connection (Neon pooler uses -pooler in host or port 6543)
const isPooled = connectionString.includes('-pooler') || connectionString.includes(':6543');

// Log connection type for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log(`[DB] Using ${isPooled ? 'pooled' : 'direct'} connection`);
}

declare global {
  var __drizzleClient: ReturnType<typeof postgres> | undefined;
}

/**
 * Connection options optimized for high-scale serverless:
 * - max: 1 for serverless (Neon pooler handles actual pooling)
 * - prepare: false for transaction pooling mode (Neon default)
 * - Short timeouts to fail fast and allow retries
 */
const connectionOptions: postgres.Options<{}> = {
  // Single connection per serverless instance - Neon pooler scales this
  max: 1,
  // CRITICAL: Disable prepared statements for Neon transaction pooling
  prepare: false,
  // SSL for production (Neon requires SSL)
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  // Connection timeout (seconds) - fail fast in serverless
  connect_timeout: 10,
  // Idle timeout - close idle connections quickly in serverless (seconds)
  idle_timeout: 20,
  // Max lifetime to prevent stale connections (seconds)
  max_lifetime: 60 * 30, // 30 minutes
  // Fetch types only once per connection (optimization)
  fetch_types: false,
};

// Global singleton - reused across requests in same serverless instance
const client = global.__drizzleClient ?? postgres(connectionString, connectionOptions);

// Persist client globally to reuse across requests (both dev and prod)
if (typeof global !== 'undefined') {
  global.__drizzleClient = client;
}

/**
 * Drizzle ORM instance - use this for all database operations
 * Singleton pattern ensures connection reuse within serverless instance
 */
export const db = drizzle(client, { schema });

/**
 * Raw postgres client for advanced queries (use sparingly)
 * Prefer using db (Drizzle) for type safety
 */
export const sql_client = client;

/**
 * Health check - lightweight query to verify DB connectivity
 * Use in /api/health endpoint
 */
export async function checkDbConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    await client`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

export * from "./schema";
export * from "./groupsSchema";
