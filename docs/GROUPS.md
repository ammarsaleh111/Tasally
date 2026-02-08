# Groups Feature — Implementation Guide

## Overview

Groups lets players compete against friends in **unlimited-mode games only**.
Every player (guest or logged-in) gets a unique display name, forms groups, invites members by exact name, and climbs a **Group Total Leaderboard** that aggregates points across all unlimited games.

---

## Quick Start (Local Testing)

```bash
# 1. Run the migration against your Neon database
npx drizzle-kit push       # or apply drizzle/0006_groups_and_identities.sql manually

# 2. Start the dev server
npm run dev

# 3. Open in browser
http://localhost:3000/groups
```

### Testing Checklist

| #   | Test Case                      | Endpoint / Page                                                 | How to Verify                                                                            |
| --- | ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Claim unique display name      | `POST /api/identity/claim`                                      | Send `{"displayName":"TestUser"}` — get 201. Send again with same norm — get 409         |
| 2   | Find by exact name             | `GET /api/identity/find?displayName=TestUser`                   | Returns `{ identityId, displayName }`. Try non-existent → 404                            |
| 3   | Create group (max 3)           | `POST /api/groups`                                              | Create 3 groups → OK. 4th → 403 `GROUP_LIMIT_REACHED`                                    |
| 4   | Invite + accept adds member    | `POST /api/groups/:id/invite` + `POST /api/invites/:id/respond` | Invite a second user, accept, check member list                                          |
| 5   | Submit results updates totals  | `POST /api/groups/:id/results`                                  | Send `{gameKey:"wordle",won:true,moves:3,timeMs:45000}` → verify `totals` in response    |
| 6   | Leaderboard sorted correctly   | `GET /api/groups/:id/leaderboard-total`                         | After multiple results, verify ORDER BY points DESC, time ASC, wins DESC                 |
| 7   | Only unlimited games in Groups | `/groups/:id` page                                              | Verify only 6 game cards shown (wordle, numbers, trivia, waffle, combinations, spelling) |
| 8   | Rate limiting works            | Rapid-fire requests                                             | After 20 calls/min to find → 429. After 30 invites/hour → 429                            |
| 9   | Guest identity persistence     | Open incognito, claim name                                      | `ammar_identity_guest` cookie persists across page loads                                 |
| 10  | Leaderboard caching            | Check response headers                                          | `Cache-Control: private, max-age=5, s-maxage=30, stale-while-revalidate=120`             |

### Manual curl Examples

```bash
# Claim display name
curl -X POST http://localhost:3000/api/identity/claim \
  -H "Content-Type: application/json" \
  -d '{"displayName":"CoolPlayer42"}'

# Find player
curl "http://localhost:3000/api/identity/find?displayName=CoolPlayer42"

# Create group
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Cookie: ammar_identity_guest=<your-guest-id>" \
  -d '{"name":"My Squad"}'

# Submit result
curl -X POST http://localhost:3000/api/groups/<groupId>/results \
  -H "Content-Type: application/json" \
  -d '{"gameKey":"wordle","won":true,"moves":3,"timeMs":45000}'

# Get leaderboard
curl "http://localhost:3000/api/groups/<groupId>/leaderboard-total?limit=10"
```

---

## Production Deployment

1. Ensure `DATABASE_URL_POOLED` is set (Neon pooler endpoint)
2. Run migration: `npx drizzle-kit push` (uses `DATABASE_URL` direct connection)
3. Deploy to Netlify as usual — no new env vars needed beyond the DB URLs

---

## Architecture Summary

### Data Flow

```
Player claims display name → identities row
Player creates group → groups + group_members rows
Player invites friend → group_invites row
Friend accepts → group_members + group_member_totals rows
Player plays unlimited game → group_game_results + group_member_totals UPDATE (atomic)
Anyone views leaderboard → SELECT from group_member_totals (15s mem cache + HTTP cache)
```

### Performance Design

| Concern                | Solution                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| Fast leaderboard       | Pre-aggregated `group_member_totals` table — no scanning `group_game_results` |
| Atomic updates         | Single SQL CTE: INSERT result + UPSERT totals in one round-trip               |
| No N+1 queries         | All list endpoints use JOINs (members, invites, leaderboard)                  |
| Read caching           | In-memory 15s TTL + HTTP `Cache-Control` with `stale-while-revalidate`        |
| Write-only on game end | No per-move writes; single POST on completion                                 |
| Connection pooling     | Uses `DATABASE_URL_POOLED` (Neon pooler), max 1 per serverless instance       |
| Rate limiting          | DB-backed rate limits on all write + find endpoints                           |

### Scoring System (`computeGroupPoints`)

All games normalized to **0–200 points per game**:

- **Won**: Base 100 + time bonus (0–40) + accuracy bonus (0–60)
- **Lost**: 5 consolation points
- Time bonus: faster = more (capped at 5 min)
- Accuracy: game-specific (attempts, moves, correct answers, etc.)

### Allowed Games (Unlimited Mode Only)

| Key          | Label        |
| ------------ | ------------ |
| wordle       | Wordle       |
| numbers      | Numbers      |
| trivia       | Trivia       |
| waffle       | Waffle       |
| combinations | Combinations |
| spelling     | Spelling Bee |

Daily-only games (connections, crossword, strands) are **excluded** from Groups.

---

## Changed / Added Files

### New Files

| File                                                      | Purpose                                               |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `src/db/groupsSchema.ts`                                  | Drizzle schema for all 6 new tables                   |
| `drizzle/0006_groups_and_identities.sql`                  | SQL migration                                         |
| `src/lib/groups/constants.ts`                             | `GROUP_UNLIMITED_GAMES`, `computeGroupPoints`, limits |
| `src/lib/groups/identity.ts`                              | Server-side identity resolution + validation          |
| `src/app/api/identity/claim/route.ts`                     | POST — claim display name                             |
| `src/app/api/identity/find/route.ts`                      | GET — find by exact name                              |
| `src/app/api/identity/me/route.ts`                        | GET — current identity                                |
| `src/app/api/groups/route.ts`                             | POST — create group                                   |
| `src/app/api/groups/mine/route.ts`                        | GET — list my groups                                  |
| `src/app/api/groups/[groupId]/route.ts`                   | GET — group details + members                         |
| `src/app/api/groups/[groupId]/invite/route.ts`            | POST — invite player                                  |
| `src/app/api/groups/[groupId]/results/route.ts`           | POST — submit game result                             |
| `src/app/api/groups/[groupId]/leaderboard-total/route.ts` | GET — total leaderboard                               |
| `src/app/api/invites/mine/route.ts`                       | GET — my pending invites                              |
| `src/app/api/invites/[inviteId]/respond/route.ts`         | POST — accept/decline                                 |
| `src/app/groups/page.jsx`                                 | Groups hub page                                       |
| `src/app/groups/[id]/page.jsx`                            | Group detail page                                     |
| `src/app/groups/invites/page.jsx`                         | Invites page                                          |
| `src/app/groups/[id]/play/[gameKey]/page.jsx`             | Play redirect page                                    |
| `src/components/groups/ClaimDisplayNameModal.jsx`         | Display name claim UI                                 |
| `src/components/groups/CreateGroupModal.jsx`              | Create group modal                                    |
| `src/components/groups/InvitePlayerModal.jsx`             | Invite player modal                                   |
| `src/components/groups/GroupLeaderboard.jsx`              | Leaderboard table                                     |
| `src/components/groups/GroupGameCards.jsx`                | Game cards grid                                       |
| `src/hooks/useGroupIdentity.ts`                           | Identity hook                                         |
| `src/hooks/useGroups.ts`                                  | Groups data hooks                                     |
| `src/hooks/useGroupGameResult.ts`                         | Group game result hook                                |
| `docs/GROUPS.md`                                          | This documentation                                    |

### Modified Files

| File                         | Change                                              |
| ---------------------------- | --------------------------------------------------- |
| `src/db/index.ts`            | Added `export * from "./groupsSchema"`              |
| `drizzle.config.ts`          | Added `groupsSchema.ts` to schema array             |
| `drizzle/meta/_journal.json` | Added migration entry idx 6                         |
| `src/lib/rateLimit.ts`       | Added 6 new rate limit configs for Groups endpoints |
| `src/app/games/page.js`      | Added "👥 Groups" link button to Games Hub          |
