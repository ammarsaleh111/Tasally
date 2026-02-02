# Performance & Scalability Upgrade Report

**Date:** February 2, 2026  
**Target:** 50+ concurrent users (immediate), 1,000+ concurrent (light realtime presence)  
**Deployment:** Serverless (Vercel/Netlify) with Neon Postgres

---

## Summary of Changes

### Phase 0: Baseline & Observability ✅

- Created `src/lib/observability.ts` - lightweight request logging
- Logs: route, method, status, duration, DB query count, rate limits
- Format: `[METRICS] route=/api/... method=POST status=200 duration=45ms db_queries=3`

### Phase 1: Stop Database Write Spam ✅

- **Heartbeat throttling:** Server-side check prevents writes if last heartbeat < MIN_INTERVAL
  - Guests: 30 seconds minimum between DB writes
  - Users: 15 seconds minimum between DB writes
- **Client heartbeat interval increased:**
  - Guests: 30 seconds (was 20)
  - Auth users: 20 seconds
- **Telemetry sampling:** Only persist critical events (start/end/win/lose) + 1-in-5 sampling for others
- **Stale session cleanup:** Now runs 1% of heartbeats instead of every request

### Phase 2: Rate Limiting ✅

- Created `src/lib/rateLimit.ts` - database-backed rate limiter
- Migration: `drizzle/0003_add_rate_limits_table.sql`
- Limits applied:
  | Route | Limit |
  |-------|-------|
  | `POST /api/auth/register` | 5/min per IP |
  | `POST /api/results` | 10/min per user/guest |
  | `POST /api/realtime/heartbeat` | 60/min per session |
  | `POST /api/realtime/telemetry` | 30/min per session |
  | `POST /api/link-guest` | 5/day per user |
  | `DELETE /api/account` | 1/hour per user |

### Phase 3: Neon Pooled Connections ✅

- Updated `src/db/index.ts`:
  - Prefers `DATABASE_POOL_URL` (PgBouncer) if available
  - Falls back to `DATABASE_URL`
  - Global singleton persisted across requests
  - Optimized settings for serverless: `max: 5`, `idle_timeout: 20`, `max_lifetime: 1800`

### Phase 4: Cache Leaderboard Reads ✅

- Created `src/lib/cache.ts` - in-memory cache with TTL
- Updated leaderboard routes:
  - Daily: 30-second cache + HTTP cache headers
  - Monthly: 60-second cache + HTTP cache headers
- Cache key pattern: `leaderboard:{type}:{game}:{dateKey}`

### Phase 5: Fix Integrity Holes ✅

- Migration: `drizzle/0004_add_daily_unique_constraint.sql`
  - Unique constraint on `(user_id, game_key, day_key, mode)` for daily
  - Unique constraint on `(guest_id, game_key, day_key, mode)` for daily guests
- Added `idempotency_key` column for replay protection
- Updated `POST /api/results` to check for duplicates before insert

### Phase 6: SSE Stream Control ✅

- Updated `/api/realtime/stream`:
  - Max 3 connections per IP
  - 2-minute connection timeout (serverless-friendly)
  - 30-second keepalive pings
  - Graceful cleanup on disconnect
  - Timeout message sent before forced close

### Phase 7: Load Test Script ✅

- Created `scripts/load-test.js` (k6)
- Tests heartbeat, leaderboard, and results submission
- Configurable for 50 or 200 VUs

---

## Files Changed

| File                                           | Change                                     |
| ---------------------------------------------- | ------------------------------------------ |
| `src/lib/observability.ts`                     | **NEW** - Request metrics logging          |
| `src/lib/rateLimit.ts`                         | **NEW** - Database-backed rate limiter     |
| `src/lib/heartbeatThrottle.ts`                 | **NEW** - Server-side heartbeat throttling |
| `src/lib/cache.ts`                             | **NEW** - In-memory cache for serverless   |
| `drizzle/0003_add_rate_limits_table.sql`       | **NEW** - Rate limits table migration      |
| `drizzle/0004_add_daily_unique_constraint.sql` | **NEW** - Duplicate prevention migration   |
| `scripts/load-test.js`                         | **NEW** - k6 load test script              |
| `src/db/index.ts`                              | Updated - Pooled connections + singleton   |
| `src/db/schema.ts`                             | Updated - Added `idempotencyKey` column    |
| `src/app/api/realtime/heartbeat/route.js`      | Updated - Throttling + rate limiting       |
| `src/app/api/realtime/telemetry/route.js`      | Updated - Sampling + rate limiting         |
| `src/app/api/realtime/stream/route.js`         | Updated - Connection limits + timeout      |
| `src/app/api/auth/register/route.ts`           | Updated - Rate limiting                    |
| `src/app/api/results/route.ts`                 | Updated - Rate limiting + idempotency      |
| `src/app/api/link-guest/route.ts`              | Updated - Rate limiting                    |
| `src/app/api/account/delete/route.ts`          | Updated - Rate limiting                    |
| `src/app/api/leaderboard/daily/route.ts`       | Updated - Caching                          |
| `src/app/api/leaderboard/monthly/route.ts`     | Updated - Caching                          |
| `src/utils/sessionTracker.js`                  | Updated - Increased heartbeat intervals    |

---

## Environment Variables

Add these to your `.env.local` or hosting provider:

```bash
# Required (already present)
DATABASE_URL=postgresql://user:pass@host/db

# Optional: Neon pooled connection (recommended for serverless)
# Get this from Neon dashboard > Connection Details > Pooled connection
DATABASE_POOL_URL=postgresql://user:pass@host-pooler/db

# Existing variables remain unchanged
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

---

## How to Test Locally

### 1. Run Database Migrations

```bash
# Apply new migrations
npx drizzle-kit migrate
# Or manually:
# psql $DATABASE_URL -f drizzle/0003_add_rate_limits_table.sql
# psql $DATABASE_URL -f drizzle/0004_add_daily_unique_constraint.sql
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Rate Limiting

```powershell
# Test heartbeat rate limit (should get 429 after 60 rapid requests)
1..70 | ForEach-Object {
  $body = '{"sessionId":"test-session","role":"GUEST"}'
  Invoke-RestMethod -Uri "http://localhost:3000/api/realtime/heartbeat" -Method POST -Body $body -ContentType "application/json"
  Start-Sleep -Milliseconds 100
}
```

### 4. Test Heartbeat Throttling

```powershell
# Send heartbeats rapidly - should see "throttled: true" responses
$body = '{"sessionId":"throttle-test","role":"GUEST"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/realtime/heartbeat" -Method POST -Body $body -ContentType "application/json"
Start-Sleep -Seconds 5
Invoke-RestMethod -Uri "http://localhost:3000/api/realtime/heartbeat" -Method POST -Body $body -ContentType "application/json"
# Second request should have throttled: true
```

### 5. Check Metrics Logging

```bash
# Watch server logs for metrics
npm run dev 2>&1 | grep "\[METRICS\]"
# Example output:
# [METRICS] route=/api/realtime/heartbeat method=POST status=200 duration=45ms db_queries=3
```

---

## Load Testing

### Install k6

```bash
# Windows (chocolatey)
choco install k6

# Mac (homebrew)
brew install k6

# Linux (snap)
snap install k6
```

### Run Load Tests

```bash
# Test against local server
k6 run scripts/load-test.js

# Test with custom base URL
k6 run -e BASE_URL=https://your-staging-site.vercel.app scripts/load-test.js

# 50 users for 2 minutes
k6 run --vus 50 --duration 2m scripts/load-test.js

# Stress test: 200 users for 5 minutes
k6 run --vus 200 --duration 5m scripts/load-test.js
```

### Expected Results

#### 50 Users (Normal Load)

- ✅ Error rate < 1%
- ✅ p95 latency < 500ms for leaderboard
- ✅ p95 latency < 300ms for heartbeat
- ✅ No DB connection errors
- ✅ Rate limiting kicks in for aggressive clients

#### 200 Users (Stress Load)

- ✅ System stays stable
- ⚠️ Higher rate limiting (expected)
- ⚠️ Some timeouts possible under extreme load
- ✅ No crashes or connection pool exhaustion

### Sample k6 Output

```
✓ heartbeat status is 200 or 429
✓ leaderboard status is 200 or 401
✓ results status is 200 or 429

checks.........................: 99.80% ✓ 14970  ✗ 30
data_received..................: 2.1 MB 17 kB/s
data_sent......................: 890 kB 7.4 kB/s
errors.........................: 0.20%  ✓ 30     ✗ 14970
heartbeat_duration.............: avg=45ms  min=12ms  med=38ms  max=320ms  p(90)=78ms   p(95)=95ms
http_req_duration..............: avg=52ms  min=8ms   med=42ms  max=450ms  p(90)=95ms   p(95)=120ms
leaderboard_duration...........: avg=35ms  min=5ms   med=28ms  max=280ms  p(90)=65ms   p(95)=85ms
rate_limited...................: 45     0.375/s
```

---

## Risks & Tradeoffs

| Risk                             | Mitigation                                                             |
| -------------------------------- | ---------------------------------------------------------------------- |
| **Cache staleness**              | 30-60s TTL is acceptable for leaderboards; real-time not critical      |
| **In-memory cache per-instance** | Each serverless instance has its own cache; acceptable for best-effort |
| **Rate limit table growth**      | Auto-cleanup on expired entries; add cron job for production           |
| **SSE connection timeout**       | Clients must implement reconnection logic (already present)            |
| **Heartbeat throttling gaps**    | Presence data may be 15-30s stale; acceptable for "light realtime"     |

---

## What to Tune if Tests Fail

| Symptom                    | Action                                                               |
| -------------------------- | -------------------------------------------------------------------- |
| Connection pool exhaustion | Increase `max` in `src/db/index.ts` or enable pooled connection      |
| High rate limit hits       | Increase limits in `RATE_LIMITS` config                              |
| Slow leaderboard queries   | Add database index on frequently filtered columns                    |
| Memory pressure            | Reduce `MAX_CACHE_ENTRIES` in cache.ts                               |
| SSE connection issues      | Reduce `MAX_CONNECTION_TIME_MS` or increase `MAX_CONNECTIONS_PER_IP` |

---

## Future Improvements (Not Implemented)

1. **Redis/Upstash for rate limiting** - Better for multi-region deployments
2. **Edge caching with Vercel KV** - Lower latency for leaderboards
3. **WebSocket upgrade** - For truly real-time features (requires non-serverless)
4. **Background job for rate limit cleanup** - Cron-based cleanup of expired entries
5. **Signed game tokens** - Cryptographic replay protection for competitive integrity

---

_Report generated by GitHub Copilot_
