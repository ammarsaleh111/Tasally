# Database Migrations

The journal lists migrations `0000` through `0009`. Fresh isolated PostgreSQL 17 exercises confirmed `0008` creates the global leaderboard tables and `0009` creates `crossword_progress`. Raw postgres.js queries, a Drizzle transaction, a relational user query, and the live health endpoint worked against the isolated schema.

The tracked SQL in `0005` is a production migration concern. `CREATE INDEX CONCURRENTLY` requires execution outside a transaction, and PostgreSQL rejects `WHERE expires_at < now()` on a partial index because `now()` is not immutable. Migration `0003` provides an ordinary index for expiration queries. `scripts/bootstrap-test-db.mjs` emits a transaction-safe fresh-test schema and has no database connection of its own. It is called by CI against its disposable service.

Before changing production, inspect the Neon branch's applied journal and actual tables and indexes using read-only access. Confirm whether operations from `0005`, `0008`, and `0009` were applied independently. Rehearse a forward-compatible migration on a Neon branch with equivalent schema. Production migration history and schema are still unverified from this environment.
