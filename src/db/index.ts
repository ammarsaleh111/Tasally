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
 * - Defers missing-URL errors until a query is actually attempted so static builds
 *   and CI environments without DB credentials do not crash during module import.
 */

// Priority: DATABASE_URL_POOLED > DATABASE_POOL_URL > DATABASE_URL
const connectionString = (
  process.env.DATABASE_URL_POOLED?.trim() ||
  process.env.DATABASE_POOL_URL?.trim() ||
  process.env.DATABASE_URL?.trim()
);

const missingDbErrorMessage =
  "Database connection not configured. Set DATABASE_URL_POOLED (recommended) or DATABASE_URL.";

// Detect if using pooled connection (Neon pooler uses -pooler in host or port 6543)
const isPooled = Boolean(
  connectionString && (connectionString.includes('-pooler') || connectionString.includes(':6543'))
);

// Log connection type for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  if (connectionString) {
    console.log(`[DB] Using ${isPooled ? 'pooled' : 'direct'} connection`);
  } else {
    console.warn(`[DB] ${missingDbErrorMessage}`);
  }
}

declare global {
  var __drizzleClient: ReturnType<typeof postgres> | undefined;
}

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

function createMissingClientProxy(): ReturnType<typeof postgres> {
  return new Proxy(
    (() => {
      throw new Error(missingDbErrorMessage);
    }) as unknown as ReturnType<typeof postgres>,
    {
      get(_target, prop) {
        if (prop === 'then' || prop === Symbol.toStringTag) return undefined;
        return () => {
          throw new Error(missingDbErrorMessage);
        };
      },
      apply() {
        throw new Error(missingDbErrorMessage);
      },
    }
  );
}

// Global singleton - reused across requests in same serverless instance
const client = connectionString
  ? (global.__drizzleClient ?? postgres(connectionString, connectionOptions))
  : createMissingClientProxy();

// Persist client globally to reuse across requests (both dev and prod)
if (connectionString && typeof global !== 'undefined') {
  global.__drizzleClient = client;
}

export const db = drizzle(client, { schema });
export const sql_client = client;

/**
 * Health check - lightweight query to verify DB connectivity
 * Use in /api/health endpoint
 */
export async function checkDbConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  if (!connectionString) {
    return { ok: false, latencyMs: 0 };
  }
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
