import test from 'node:test';
import assert from 'node:assert/strict';
import { is } from 'drizzle-orm';
import { PgDatabase } from 'drizzle-orm/pg-core';

test('database module imports without credentials and fails only on access', async () => {
  for (const key of ['DATABASE_URL', 'DATABASE_URL_POOLED', 'DATABASE_POOL_URL']) delete process.env[key];
  const { db, checkDbConnection } = await import('../src/db/index');
  assert.ok(is(db, PgDatabase));
  assert.deepEqual(await checkDbConnection(), {ok:false, latencyMs:0});
  assert.throws(() => db.select(), /Database connection not configured/);
});
