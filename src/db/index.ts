import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database Client Configuration - Scalability Optimized
 *
 * Optimized for serverless (Vercel) with Neon Postgres:
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

// Initialize only when a database operation actually needs the client.
// Drizzle configures postgres.js parser/serializer maps during construction;
// a fake client cannot satisfy that contract.
function getClient(): ReturnType<typeof postgres> {
  if (!connectionString) throw new Error(missingDbErrorMessage);
  return global.__drizzleClient ??= postgres(connectionString, connectionOptions);
}

function createDb() {
  return drizzle(getClient(), { schema });
}

let database: ReturnType<typeof createDb> | undefined;
function getDb() {
  return database ??= createDb();
}

// Keep Drizzle's database prototype visible to adapters that inspect the type.
const lazyDatabase = Object.create(PostgresJsDatabase.prototype) as ReturnType<typeof createDb>;

export const db = new Proxy(lazyDatabase, {
  get(_target, prop) {
    if (prop === "then") return undefined;
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const sql_client = new Proxy(
  (() => undefined) as unknown as ReturnType<typeof postgres>,
  {
    apply(_target, _thisArg, args) {
      return Reflect.apply(getClient(), undefined, args);
    },
    get(_target, prop) {
      if (prop === "then") return undefined;
      const instance = getClient();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  }
);

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
    await getClient()`SELECT 1`;
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (error) {
    console.error('[DB] Health check failed:', error);
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}

export * from "./schema";
export * from "./groupsSchema";
