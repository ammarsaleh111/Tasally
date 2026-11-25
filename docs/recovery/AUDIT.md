# Tasally Production Audit

## Critical Findings
1. **Prerender Failure (`useSearchParams()` without Suspense)**: `OnboardingFlow` (mounted globally in `src/app/layout.js`), `LoginPage` (`src/app/login/page.jsx`), and `AdminLoginPage` (`src/app/admin/login/page.jsx`) called `useSearchParams()` without a React `Suspense` boundary, causing `next build` to fail prerendering `/_not-found` and `/groups`.
2. **Expired Daily Puzzle Datasets**: Historical datasets ended `2026-06-30`. Current date (`2026-11-25`) had no puzzles, and `all-data` used month-only keys (`month-02`..`month-06`) that would collide across calendar years.
3. **Silent Historical Fallback & Bypassed Loaders**: `connectionsLogic.js` fell back to `2026-01-01` and bypassed `all-data`; `strands/page.jsx` bypassed `all-data`; `all-data/index.ts` fell back to earlier dates in the same month.

## High Priority Findings
1. **Service Worker Unsafe Offline POST Replay**: `public/sw.js` queued *all* `/api/*` POST requests (including `/api/auth/*`, `/api/admin/*`, `/api/account/*`, `/api/identity/*`) and replayed them without identity verification or deduplication.
2. **Build-Time DB Crash Risk**: `src/db/index.ts` threw at module import time when `DATABASE_URL` / `DATABASE_URL_POOLED` was unset, risking `Collecting page data` failures in CI.
3. **Drizzle Migration Journal Gap**: `drizzle/meta/_journal.json` omitted `0008_global_leaderboard_tables` and `0009_crossword_progress`.
4. **Missing `.env.example` in Git & Missing Admin Vars**: `.gitignore` ignored `.env.example`; `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` were undocumented for production.

## Cloud recovery findings

- Reproduced the reported `1184` error by importing `src/db/index.ts` on master `c896cc3` with the three database URL variables unset. Drizzle initializes postgres.js parser and serializer maps during construction. The proxy on master supplies neither map. PR #2 defers construction until a database operation needs a real client.
- Next's Google Fonts fetches failed under the cloud egress policy. The recovery build uses local Cairo, Geist, and Geist Mono assets from the same upstream font project.
- Migration `0005` contains concurrent index builds and a partial-index predicate based on `now()`. An isolated PostgreSQL instance rejected that predicate. The disposable bootstrap applies the rest of the schema with ordinary index builds and the existing expiry index from `0003`.
- The original client dataset chunk contained multiple games' datasets. The new loaders preserve Cairo dates and the 160 existing JSON sources while allowing the client to load its own game's data.
- The offline queues previously allowed result entries with no usable ownership binding. Both replay paths now require a matching identity, and the result APIs verify that identity against the active request.
