// Apply only the additive migration needed by this release before Netlify publishes it.
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.DATABASE_URL_POOLED || process.env.DATABASE_POOL_URL;
if (!url) throw new Error('A database URL is required to prepare anonymous names');
const client = postgres(url, { max: 1, prepare: false, connect_timeout: 10 });
try {
  const migration = await readFile(new URL('../drizzle/0010_anonymous_name_number.sql', import.meta.url), 'utf8');
  await client.unsafe(migration);
} finally {
  await client.end();
}
