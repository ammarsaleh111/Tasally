# Production recovery (draft)

## Release gates
- Run npm ci, node --test tests/identity-lookup.test.mjs, npx tsx --test tests/daily-data.test.ts, npm run build.
- Test Vercel preview before merging. Check homepage, direct game routes, static JS/CSS MIME and identity endpoint.
- Verify both domains independently; canonical redirect is disabled unless ENFORCE_CANONICAL_REDIRECT=true and canonical host is configured. Enable only after DNS and TLS verification.
- Check DATABASE_URL_POOLED / DATABASE_POOL_URL / DATABASE_URL and auth secrets in Vercel without exposing values.
- Database migration journal omits 0008 and 0009. Compare actual production schema and back up before any migration. No database writes were performed.
- Daily data ends June 2026. Supply validated new puzzles for all nine games; do not silently relabel historical puzzles as current competitive puzzles. Crossword now reports unavailable dates explicitly; other game UI recovery remains to be tested.
- PWA private API caching is narrowed; offline POST replay and identity binding need a separate audit before release.
- Verify guest claims, login, account linking, leaderboards, groups, offline play and saved progress using a test database.
- No production merge until owner approval. Roll back via previous Vercel deployment or revert source commits.
