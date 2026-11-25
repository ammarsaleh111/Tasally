// Emit schema SQL for a fresh, disposable PostgreSQL database.
// Apply with psql --single-transaction -v ON_ERROR_STOP=1.
import { readFileSync } from "node:fs";

const directory = new URL("../drizzle/", import.meta.url);
const journal = JSON.parse(readFileSync(new URL("meta/_journal.json", directory), "utf8"));
const invalidExpiryIndex = /CREATE INDEX IF NOT EXISTS rate_limits_expires_cleanup_idx\s+ON rate_limits \(expires_at\)\s+WHERE expires_at < now\(\);/;

const migrations = journal.entries.map(({ tag }) => {
  const sql = readFileSync(new URL(`${tag}.sql`, directory), "utf8");
  if (tag !== "0005_scalability_indexes_and_cache") return sql;

  // PostgreSQL rejects now() in a partial-index predicate. Migration 0003
  // already provides an expires_at index for cleanup. A fresh database can
  // also build ordinary indexes within the bootstrap transaction.
  if (!invalidExpiryIndex.test(sql)) throw new Error("Review test bootstrap after migration 0005 changed");
  return sql
    .replaceAll("CREATE INDEX CONCURRENTLY", "CREATE INDEX")
    .replace(invalidExpiryIndex, "");
});

process.stdout.write(migrations.join("\n") + "\n");
