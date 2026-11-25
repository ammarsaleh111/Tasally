# Test Report

- `npx tsc --noEmit`: Passed (exit code 0)
- `npm run lint`: Passed (exit code 0)
- `npm run validate:puzzles`: Passed (3,285/3,285 valid, 3,650 unique trivia questions)
- `npm run test:puzzles` (`tests/daily-data.test.ts`): Passed (4/4)
- `node --test tests/identity-lookup.test.mjs`: Passed (6/6)
- `npx tsx --test tests/game-engines.test.ts`: Passed (9/9)
- `node --test tests/sw-offline.test.mjs`: Passed (1/1)
- `npm run build`: Passed (77/77 static pages)
- `node tests/smoke-production.mjs`: Passed (21 routes, static JS MIME, `/api/crossword/daily`, `/api/health`)

## Cloud recovery validation

| Check | Result |
| --- | --- |
| Frozen install with Node.js 22.23.5 | Passed |
| Puzzle validation | 3,285 of 3,285 entries passed |
| Daily data, identity lookup, game engines, database initialization, worker, and result identity tests | 23 passed |
| API smoke against local PostgreSQL | 11 passed |
| Local email registration, credentials sign-in, signed-in session, and guest display-name claim | Passed in Chromium |
| Chromium daily game completions | Wins observed in all nine games across the validation runs. The latest Crossword run restored its saved letter after refresh. The first Wordle offline attempt reached its win screen but did not submit on reconnect |
| Mobile Chromium route pass | All nine game routes returned HTTP 200. This was a rendering check at 390 pixels wide |
| TypeScript and lint | Passed under the existing lint rules |
| Production builds with and without PostgreSQL configuration | Passed on Next.js 16.4.6 |
| Production HTTP smoke with and without PostgreSQL configuration | 25 routes per run, static JavaScript MIME, Crossword API, health API, and Arabic route checks passed |
| Production dependency audit | Zero findings after the targeted upgrades |

The offline browser attempt revealed a result queued without an owner despite a signed-in session. The binding moved to a separate session-scoped key in `206d277`. The production retry exposed the underlying cause, a startup task that discards non-JSON values. After `f02741b` stored the binding as JSON, the production Wordle test passed. Browser screenshots and the test scripts are available in `/workspace/.tasally/browser` in the prepared environment.

Remaining coverage includes the full win/loss and hint matrix, historical date selection through every UI, complete account switching and previous-worker upgrade tests, Google OAuth, authenticated administrator flows, and the live Netlify release. The API smoke verifies unauthorized access and the database health check.

The follow-up Chromium run reproduced an offline Wordle win, inspected a queued record owned by the signed-in identity, reconnected, received HTTP 200 from result submission, and opened the authenticated daily leaderboard. Guest linking, group creation, group membership lookup, and opening the group leaderboard also passed. A separate isolated database check passed for postgres.js raw SQL, a Drizzle transaction, a relational query, and the Auth.js Drizzle adapter. The app itself uses NextAuth callbacks with explicit queries for account handling.

The local runs used Node.js 22 and the following repository entry points.

```sh
npm ci
npx tsc --noEmit
npm run lint
npm run validate:puzzles
npm run test:puzzles
node --test tests/identity-lookup.test.mjs tests/sw-offline.test.mjs
npx tsx --test tests/game-engines.test.ts tests/db-initialization.test.ts tests/result-identity.test.ts
npm run build
node tests/smoke-production.mjs
npm run start
npm run test:api
npm audit --omit=dev
```

The two production smoke runs used the same commands with credential-free and isolated PostgreSQL environments. A separate production HTTP check verified CSS MIME, healthy database status, Arabic canonical tags, and the Arabic FAQ redirect. [GitHub CI for the application changes](https://github.com/ammarsaleh111/Tasally/actions/runs/45640319356)

A second production-mode Chromium run exercised switching between two accounts with the client queue. It held the original account's offline Wordle result while the other account was signed in, then submitted it successfully after signing back into the original account. The worker's matching, different-owner, and anonymous cases are covered by unit tests. Previous-worker upgrade and stale-chunk recovery still need browser coverage.
