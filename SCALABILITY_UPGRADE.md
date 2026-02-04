# Scalability Upgrade Report

**Date:** February 4, 2026  
**Target:** 10,000–50,000 concurrent online users

## Summary

This upgrade implements a comprehensive scalability plan for the Ammar Times platform, focusing on:
- Lightweight presence tracking (online users count + last_seen)
- DB connection pooling optimized for serverless
- DB-level leaderboard caching to eliminate expensive queries
- Rate limiting for protection against abuse
- Edge caching headers for CDN optimization

---

## Files Changed/Added

### Database Layer

| File | Purpose |
|------|---------|
| [src/db/index.ts](src/db/index.ts) | **Updated** - Singleton DB client using `DATABASE_URL_POOLED`, `max: 1` connection, `prepare: false` for Neon transaction pooling |
| [src/db/schema.ts](src/db/schema.ts) | **Updated** - Added `leaderboardCache` and `rateLimits` table schemas |
| [drizzle/0005_scalability_indexes_and_cache.sql](drizzle/0005_scalability_indexes_and_cache.sql) | **New** - Migration with indexes and leaderboard_cache table |

### Presence Tracking

| File | Purpose |
|------|---------|
| [src/app/api/presence/heartbeat/route.ts](src/app/api/presence/heartbeat/route.ts) | **New** - POST endpoint for presence heartbeat (auth required, 30s server throttle) |
| [src/app/api/presence/online-count/route.ts](src/app/api/presence/online-count/route.ts) | **New** - GET endpoint for online user count (cached, public) |
| [src/app/api/admin/online-users/route.ts](src/app/api/admin/online-users/route.ts) | **New** - GET endpoint for admin to see online users list |
| [src/hooks/usePresenceHeartbeat.ts](src/hooks/usePresenceHeartbeat.ts) | **New** - React hook for client-side heartbeat (90s interval, visibility API) |
| [src/components/PresenceProvider.tsx](src/components/PresenceProvider.tsx) | **New** - Provider component to integrate presence into app |
| [src/app/layout.js](src/app/layout.js) | **Updated** - Integrated PresenceProvider |

### Caching & Performance

| File | Purpose |
|------|---------|
| [src/lib/leaderboardCache.ts](src/lib/leaderboardCache.ts) | **New** - DB-level caching for leaderboards with TTL |
| [src/app/api/leaderboard/daily/route.ts](src/app/api/leaderboard/daily/route.ts) | **Updated** - Uses DB cache, rate limiting, improved edge caching |
| [src/app/api/leaderboard/monthly/route.ts](src/app/api/leaderboard/monthly/route.ts) | **Updated** - Uses DB cache, rate limiting, improved edge caching |

### Rate Limiting & Health

| File | Purpose |
|------|---------|
| [src/lib/rateLimit.ts](src/lib/rateLimit.ts) | **Updated** - Added `PRESENCE_HEARTBEAT`, `LEADERBOARD`, `LOGIN` rate limit configs |
| [src/app/api/health/route.ts](src/app/api/health/route.ts) | **New** - Health check endpoint for monitoring |

---

## Database Changes

### New Tables

#### `leaderboard_cache`
```sql
CREATE TABLE leaderboard_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  compute_time_ms INTEGER
);
```

### New Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `users_last_seen_at_idx` | users | Fast online count queries |
| `users_id_last_seen_idx` | users | Fast heartbeat updates |
| `leaderboard_cache_expires_idx` | leaderboard_cache | Cache expiry checks |
| `game_results_daily_leaderboard_idx` | game_results | Daily leaderboard queries |
| `game_results_monthly_leaderboard_idx` | game_results | Monthly aggregation queries |
| `presence_sessions_active_idx` | presence_sessions | Admin dashboard queries |

---

## Environment Variables

### Required (New)

```env
# Neon pooled connection string (use the "-pooler" endpoint)
# This is REQUIRED for high concurrency
DATABASE_URL_POOLED=postgresql://user:pass@your-host-pooler.neon.tech/dbname?sslmode=require

# Keep DATABASE_URL for migrations only
DATABASE_URL=postgresql://user:pass@your-host.neon.tech/dbname?sslmode=require
```

### Priority Order

The DB client checks for connection strings in this order:
1. `DATABASE_URL_POOLED` (recommended)
2. `DATABASE_POOL_URL` (legacy)
3. `DATABASE_URL` (fallback)

---

## API Endpoints

### Presence

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/presence/heartbeat` | Required | Update user's last_seen_at |
| GET | `/api/presence/online-count` | Optional | Get count of online users |
| GET | `/api/admin/online-users` | Admin | List online users (limit param) |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | System health check |

---

## Configuration

### Heartbeat Intervals

| Component | Interval | Purpose |
|-----------|----------|---------|
| Client hook | 90 seconds | Between heartbeat requests |
| Server throttle | 30 seconds | Skip DB write if recent |
| Online window | 2-3 minutes | Consider user "online" |

### Cache TTLs

| Cache | TTL | Purpose |
|-------|-----|---------|
| Daily leaderboard | 30 seconds | Near-real-time with low DB load |
| Monthly leaderboard | 120 seconds | Less dynamic, longer cache |
| Online count (memory) | 5 seconds | Fast local cache |
| Online count (CDN) | 10 seconds | Edge cache for scale |

### Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Presence heartbeat | 2/min | Per user |
| Leaderboard | 30/min | Per user |
| Login | 10/min | Per IP |

---

## Testing Checklist

### Local Development

1. **Database Migration**
   ```bash
   npm run db:migrate
   ```

2. **Verify Health Endpoint**
   ```bash
   curl http://localhost:3000/api/health
   # Expected: {"status":"healthy","checks":{"database":{"status":"ok",...}}}
   ```

3. **Test Heartbeat (authenticated)**
   ```bash
   # Login first, then:
   curl -X POST http://localhost:3000/api/presence/heartbeat \
     -H "Cookie: <session-cookie>"
   # Expected: {"ok":true,"updated":true,"serverTime":"..."}
   ```

4. **Test Online Count**
   ```bash
   curl http://localhost:3000/api/presence/online-count
   # Expected: {"onlineCount":1,"windowSeconds":120,"computedAt":"..."}
   ```

5. **Test Leaderboard Caching**
   ```bash
   # First request - should compute
   curl "http://localhost:3000/api/leaderboard/daily?game=wordle"
   # Look for: "cached":false, "computeTimeMs":...
   
   # Second request within 30s - should cache hit
   curl "http://localhost:3000/api/leaderboard/daily?game=wordle"
   # Look for: "cached":true
   ```

### Production Verification

1. **Check DB Connection Pooling**
   - Monitor Neon dashboard for connection count
   - Should see pooled connections (not direct)
   - Max connections should stay low even under load

2. **Verify Online Count Under Load**
   ```bash
   # Run multiple times concurrently
   for i in {1..10}; do
     curl -s "https://your-site.netlify.app/api/presence/online-count" &
   done
   ```

3. **Verify Cache Headers**
   ```bash
   curl -I "https://your-site.netlify.app/api/presence/online-count"
   # Look for: Cache-Control: public, max-age=5, s-maxage=10, stale-while-revalidate=30
   ```

4. **Monitor Connection Errors**
   - Check Netlify function logs for "connection" errors
   - Should see no "too many connections" errors

5. **Verify Rate Limiting**
   ```bash
   # Should get 429 after 2 requests/minute
   for i in {1..5}; do
     curl -X POST "https://your-site.netlify.app/api/presence/heartbeat" \
       -H "Cookie: <session>"
   done
   ```

### Load Testing

For serious load testing, use the included script:

```bash
node scripts/load-test.js --concurrent=100 --duration=60
```

Monitor:
- Response times (should be <100ms for cached endpoints)
- DB connection count (should stay under Neon limit)
- Error rate (should be <1%)

---

## Scaling Considerations

### Current Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Neon connections | 100 (free) / 1000 (pro) | Pooler handles this |
| Netlify function duration | 10s default | Increase if needed |
| CDN cache | Unlimited | Netlify edge |

### If You Need More Scale

1. **More DB Connections**: Upgrade Neon plan
2. **Faster Presence**: Consider Neon with read replicas
3. **Real-time Features**: Add Pusher/Ably (not WebSockets in serverless)
4. **Global Distribution**: Neon regional read replicas

---

## Migration Steps (Production)

1. **Set Environment Variable**
   ```
   DATABASE_URL_POOLED=<your-neon-pooler-connection-string>
   ```

2. **Run Migration**
   ```bash
   npm run db:migrate
   ```

3. **Deploy**
   ```bash
   git push origin main
   # Netlify auto-deploys
   ```

4. **Verify**
   - Check `/api/health` returns healthy
   - Check `/api/presence/online-count` works
   - Monitor for errors in Netlify logs

---

## Architecture Notes

### Why These Choices?

1. **Single DB Connection Per Instance**: Neon pooler handles actual pooling. Multiple connections per serverless instance causes exhaustion under scale.

2. **DB-Level Cache vs Redis**: Avoids adding infrastructure. Neon is fast enough for cache reads. Trade-off: slightly higher latency than Redis.

3. **90-Second Heartbeat**: Balance between accuracy (2-min online window) and DB write load. At 50k users = ~550 writes/second maximum.

4. **Server-Side Throttle**: Even if client sends multiple heartbeats, server skips DB write if recent. Protects against buggy clients.

5. **Edge Caching**: Netlify CDN caches responses. `stale-while-revalidate` means users get fast responses while cache refreshes in background.

---

## Troubleshooting

### "Too Many Connections"

- Verify `DATABASE_URL_POOLED` is set (not `DATABASE_URL`)
- Check Neon dashboard for connection count
- Ensure `max: 1` in db/index.ts

### Slow Leaderboard

- Check if cache is working (`cached: true` in response)
- Run `EXPLAIN ANALYZE` on queries
- Verify indexes exist in database

### Missing Online Users

- Check heartbeat is being sent (browser devtools → Network)
- Verify user is authenticated
- Check `last_seen_at` is updating in database

### High Rate Limit Errors

- Client sending too frequently
- Check `usePresenceHeartbeat` interval
- Consider increasing rate limit for legitimate use cases

---

*Last updated: February 4, 2026*
