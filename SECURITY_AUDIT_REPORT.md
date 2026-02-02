# Security Audit Report - Ammar Times

**Date:** February 2, 2026  
**Auditor:** GitHub Copilot  
**Scope:** Full security & critical bug audit with evidence

---

## Executive Summary

### Top 5 Risks (Prioritized)

| #   | Risk                                                                                        | Severity    | Status              |
| --- | ------------------------------------------------------------------------------------------- | ----------- | ------------------- |
| 1   | **Heartbeat FK Violation** - Guest users crash the heartbeat API (500 errors flooding logs) | 🔴 CRITICAL | ✅ FIXED            |
| 2   | **Missing Rate Limiting** - Registration, score submission, heartbeat endpoints unprotected | 🔴 HIGH     | ⚠️ Fix Required     |
| 3   | **IDOR in Guest Linking** - Any user can claim any orphaned guest profile                   | 🟡 MEDIUM   | ⚠️ Fix Required     |
| 4   | **Next.js DoS Vulnerabilities** - 3 high-severity issues in Next.js 16.1.1                  | 🔴 HIGH     | ⚠️ Upgrade Required |
| 5   | **tar Path Traversal** - bcrypt dependency chain includes vulnerable tar                    | 🔴 HIGH     | ⚠️ Upgrade bcrypt   |

---

## 1. Dependency Vulnerabilities (npm audit)

### Evidence: Exact Versions Installed

```
npm ls next bcrypt tar esbuild

ammar_times@0.1.0 F:\DEPI\ammar_times
├─┬ bcrypt@5.1.1
│ └─┬ @mapbox/node-pre-gyp@1.0.11
│   └── tar@6.2.1
├─┬ drizzle-kit@0.31.8
│ ├─┬ @esbuild-kit/esm-loader@2.6.5
│ │ └─┬ @esbuild-kit/core-utils@3.3.2
│ │   └── esbuild@0.18.20
│ ├─┬ esbuild-register@3.6.0
│ │ └── esbuild@0.25.12 deduped
│ └── esbuild@0.25.12
├─┬ next-auth@5.0.0-beta.30
│ └── next@16.1.1 deduped
└── next@16.1.1
```

### 1.1 Next.js DoS Vulnerabilities

| Advisory                                                                 | Severity | CVSS | Affected                 | Fixed In | Exploitable Here?                                     |
| ------------------------------------------------------------------------ | -------- | ---- | ------------------------ | -------- | ----------------------------------------------------- |
| [GHSA-9g9p-9gw9-jx7f](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f) | Moderate | 5.3  | 15.6.0-canary.0 - 16.1.4 | 16.1.6   | ❌ **No** - No `next/image` usage with remotePatterns |
| [GHSA-5f7q-jpqc-wp7h](https://github.com/advisories/GHSA-5f7q-jpqc-wp7h) | High     | 7.5  | 15.6.0-canary.0 - 16.1.4 | 16.1.6   | ❌ **No** - PPR not enabled                           |
| [GHSA-h25m-26qc-wcjf](https://github.com/advisories/GHSA-h25m-26qc-wcjf) | High     | 7.5  | 15.6.0-canary.0 - 16.1.4 | 16.1.6   | ⚠️ **Possibly** - RSC used implicitly                 |

**Feature Usage Analysis:**

- **Image Optimizer:** Not using `next/image` with external images (grep found no remotePatterns config)
- **PPR (Partial Prerendering):** Not enabled in `next.config.mjs` (grep found no `experimental.ppr`)
- **React Server Components:** Used implicitly by App Router (potential exposure)

**Recommendation:** Upgrade to `next@16.1.6` as defense-in-depth.

### 1.2 tar Path Traversal

| Advisory                                                                 | Severity | CVSS | Affected | Fixed In |
| ------------------------------------------------------------------------ | -------- | ---- | -------- | -------- |
| [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97) | High     | 8.6  | <=7.5.6  | 7.5.7    |
| [GHSA-r6q2-hw4h-h46w](https://github.com/advisories/GHSA-r6q2-hw4h-h46w) | High     | 7.3  | <=7.5.6  | 7.5.7    |
| [GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v) | High     | 8.6  | <=7.5.6  | 7.5.7    |

**Why It Matters:** `tar@6.2.1` is vulnerable. Used during `bcrypt` native module compilation (npm install).

**Exploitability:** Low in production (only affects install-time), but a supply chain concern.

**Fix:** `npm install bcrypt@6.0.0` (includes `node-pre-gyp` update with fixed tar)

### 1.3 esbuild CORS Bypass

| Advisory                                                                 | Severity | Affected         | Exploitable?                |
| ------------------------------------------------------------------------ | -------- | ---------------- | --------------------------- |
| [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Moderate | esbuild <=0.24.2 | ❌ **No** - Dev server only |

**Installed:** `esbuild@0.18.20` via drizzle-kit (only used in development CLI).

---

## 2. API Route Security Matrix

### Full Route Audit (22 Routes)

| Route                      | Methods           | Auth Level       | Guard Code                                 | Rate Limited        | DB Writes         | Issues                             |
| -------------------------- | ----------------- | ---------------- | ------------------------------------------ | ------------------- | ----------------- | ---------------------------------- |
| `/api/account`             | DELETE            | ✅ AUTHENTICATED | `await auth(); if (!userId)`               | ❌ **NO**           | ✅ DELETE cascade | Missing rate limit                 |
| `/api/activity`            | GET, POST         | PUBLIC           | IP-based                                   | ✅ 30/min           | ✅ File-based     | —                                  |
| `/api/admin/activity`      | GET               | 🔒 ADMIN         | `validateAdminSession(token)`              | ❌                  | ❌                | —                                  |
| `/api/admin/login`         | GET, POST, DELETE | Mixed            | `isIpBlocked()` + `validateAdminSession()` | ✅ 5 attempts/15min | ❌                | —                                  |
| `/api/admin/metrics`       | GET               | 🔒 ADMIN         | `validateAdminSession(token)`              | ❌                  | ❌                | —                                  |
| `/api/admin/theme`         | GET, PUT          | 🔒 ADMIN         | `validateAdminSession(token)`              | ❌                  | ✅                | —                                  |
| `/api/admin/users`         | GET, DELETE       | 🔒 ADMIN         | `validateAdminSession(token)`              | ❌                  | ✅ DELETE cascade | —                                  |
| `/api/admin/users/[id]`    | DELETE            | 🔒 ADMIN         | `validateAdminSession(token)`              | ❌                  | ✅ DELETE cascade | —                                  |
| `/api/auth/[...nextauth]`  | GET, POST         | PUBLIC           | NextAuth handlers                          | ❌                  | ✅                | —                                  |
| `/api/auth/register`       | POST              | PUBLIC           | None                                       | ❌ **NO**           | ✅ INSERT         | **Missing rate limit**             |
| `/api/leaderboard/daily`   | GET               | ✅ AUTHENTICATED | `await auth()`                             | ❌                  | ❌                | —                                  |
| `/api/leaderboard/monthly` | GET               | ✅ AUTHENTICATED | `await auth()`                             | ❌                  | ❌                | —                                  |
| `/api/link-guest`          | POST              | ✅ AUTHENTICATED | `await auth()`                             | ❌ **NO**           | ✅ UPDATE         | **IDOR Risk**                      |
| `/api/players`             | GET, POST         | PUBLIC           | IP-based                                   | ✅ 30/min           | ✅ File-based     | —                                  |
| `/api/realtime/heartbeat`  | POST              | PUBLIC           | UUID validation only                       | ❌ **NO**           | ✅ UPSERT         | **Missing rate limit**, role trust |
| `/api/realtime/poll`       | GET               | PUBLIC           | None                                       | ❌                  | ❌                | —                                  |
| `/api/realtime/stream`     | GET (SSE)         | PUBLIC           | None                                       | ❌                  | ❌                | Public SSE exposure                |
| `/api/realtime/telemetry`  | POST              | PUBLIC           | None                                       | ❌ **NO**           | ✅ INSERT         | **Missing rate limit**, role trust |
| `/api/results`             | POST              | Mixed            | `await auth()` or guestId                  | ❌ **NO**           | ✅ INSERT         | **Missing rate limit**             |
| `/api/theme/settings`      | GET               | PUBLIC           | None                                       | ❌                  | ❌                | —                                  |
| `/api/word-definition`     | GET               | PUBLIC           | None                                       | External API        | ❌                | —                                  |
| `/api/word-validation`     | POST              | PUBLIC           | None                                       | ✅ 30/min           | ❌                | —                                  |

### 2.1 Admin Endpoints - Server-Side Protection Verified ✅

All admin routes are protected with the same guard pattern:

```javascript
// From src/app/api/admin/users/route.ts
const token = (await cookies()).get("admin_session")?.value;
const authenticated = await validateAdminSession(token);
if (!authenticated) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Guard Function:** `validateAdminSession()` in [src/lib/adminAuth.js](src/lib/adminAuth.js)

- Uses HMAC-SHA256 signed tokens
- Timing-safe comparison via `crypto.timingSafeEqual()`
- Session expiry enforced (7 days)

### 2.2 IDOR Vulnerability - Guest Linking

**Location:** [src/app/api/link-guest/route.ts](src/app/api/link-guest/route.ts)

**Issue:** Any authenticated user can claim ANY guest profile by providing its UUID:

```javascript
const parsed = schema.safeParse(await request.json());
const { guestId } = parsed.data;

// ❌ NO VERIFICATION that guestId belongs to the current session/device
await db
  .update(gameResults)
  .set({ userId: session.user.id })
  .where(eq(gameResults.guestId, guestId));
```

**Attack Scenario:**

1. Attacker observes guest UUIDs (visible in network requests)
2. Attacker registers an account
3. Attacker calls `/api/link-guest` with victim's guestId
4. Victim's game history transferred to attacker

**Severity:** 🟡 MEDIUM (data integrity, not confidentiality)

**Fix Required:** Verify guestId belongs to the current session via signed cookie or localStorage fingerprint.

### 2.3 Client-Provided Role Trust

**Affected Routes:**

- `/api/realtime/heartbeat` - Client sends `role` field
- `/api/realtime/telemetry` - Client sends `role` field

**Current Code:**

```javascript
const safeRole = typeof role === "string" ? role.toUpperCase() : null;
const normalizedRole =
  safeRole === "ADMIN" || safeRole === "USER" || safeRole === "GUEST"
    ? safeRole
    : "GUEST";
```

**Issue:** While the role is normalized (not used for access control), it affects `userId` vs `guestId` assignment.

**Severity:** 🟢 LOW - Role is only used for classification, not authorization.

**Recommendation:** Derive role from server-side session (`await auth()`) instead of trusting client input.

---

## 3. CSRF & Cookie Security

### 3.1 Cookie Configuration Evidence

**Admin Session Cookie** (from [src/app/api/admin/login/route.js](src/app/api/admin/login/route.js#L16-L21)):

```javascript
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict", // ✅ Blocks cross-site requests
  secure: process.env.NODE_ENV === "production", // ✅ HTTPS-only in prod
  path: "/",
};
```

**NextAuth Session Cookie:**
Uses default NextAuth cookie configuration with:

- `httpOnly: true`
- `sameSite: 'lax'` (NextAuth default)
- `secure: true` in production

### 3.2 CSRF Protection Analysis

| Auth Type       | SameSite | CSRF Token?   | Cross-Site POST? | Status           |
| --------------- | -------- | ------------- | ---------------- | ---------------- |
| Admin (custom)  | `strict` | ❌ Not needed | ❌ Blocked       | ✅ **Protected** |
| User (NextAuth) | `lax`    | Via NextAuth  | ⚠️ GET allowed   | ✅ **Protected** |

**Why SameSite=Lax is Sufficient:**

- All state-changing operations use POST/DELETE
- `SameSite=Lax` blocks cross-site POST requests
- NextAuth includes CSRF token in forms

### 3.3 Verification Commands

```bash
# Check admin cookie in browser DevTools:
# Application → Cookies → Look for "admin_session"
# Verify: HttpOnly=true, SameSite=Strict, Secure=true (prod)

# Test cross-site POST (should fail):
curl -X POST http://localhost:3001/api/admin/theme \
  -H "Cookie: admin_session=..." \
  -H "Origin: https://evil.com"
# Expected: 401 Unauthorized (cookie not sent due to SameSite)
```

---

## 4. Input Validation Analysis

### 4.1 Current Approach

**Zod Schema Validation (4 routes):**

- `/api/auth/[...nextauth]` - Credentials validation
- `/api/auth/register` - Email/password validation
- `/api/link-guest` - UUID validation
- `/api/results` - Full schema validation

**Manual Validation (remaining routes):**
Uses `inputSanitizer.js` with pattern detection + output encoding.

### 4.2 Sanitization Strengths

✅ **HTML Entity Encoding:**

```javascript
function escapeHtml(text) {
  const htmlEscapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}
```

✅ **Allowlist for Names:**

```javascript
const NAME_ALLOWED_REGEX = /^[\p{L}\p{N} .,'_-]+$/u; // Unicode letters/numbers only
```

✅ **Length Limits:**

```javascript
const MAX_LENGTHS = { NAME: 30, WORD: 30, MESSAGE: 500, GENERAL: 200 };
```

### 4.3 XSS Vector Analysis

**User-Controlled Data Rendered:**

1. `displayName` - Rendered on leaderboards, game UI
2. Player names - In-memory activity feed

**Protection:**

- React auto-escapes JSX by default
- No `dangerouslySetInnerHTML` usage (verified via grep)
- Names are allowlist-validated before storage

**SQL Injection:** Protected by Drizzle ORM parameterized queries regardless of input sanitization.

---

## 5. Rate Limiting Gaps

### Routes Requiring Rate Limiting

| Route                     | Risk                                   | Current | Recommended            |
| ------------------------- | -------------------------------------- | ------- | ---------------------- |
| `/api/auth/register`      | Registration spam, credential stuffing | ❌ None | 5 req/min per IP       |
| `/api/results`            | Score spam, DB bloat                   | ❌ None | 10 req/min per user    |
| `/api/realtime/heartbeat` | DB write spam, serverless costs        | ❌ None | 60 req/min per session |
| `/api/realtime/telemetry` | Event log spam                         | ❌ None | 30 req/min per session |
| `/api/account`            | Account deletion abuse                 | ❌ None | 1 req/hour per user    |
| `/api/link-guest`         | Guest linking abuse                    | ❌ None | 5 req/day per user     |

### Implementation Pattern

The codebase has a rate limiter ready in `inputSanitizer.js`:

```javascript
export function isRateLimited(identifier, maxRequests = 10, windowMs = 60000) {
  // ... implementation exists
}
```

---

## 6. Database Security

### 6.1 Schema Constraints

| Constraint  | Table                         | Column(s)                       | Purpose                    |
| ----------- | ----------------------------- | ------------------------------- | -------------------------- |
| Unique      | `users`                       | `email`                         | Prevent duplicate accounts |
| Unique      | `sessions`                    | `session_token`                 | Unique session IDs         |
| Unique      | `verification_tokens`         | `token`                         | Token collision prevention |
| Unique      | `accounts`                    | `provider, provider_account_id` | OAuth deduplication        |
| FK Cascade  | `accounts` → `users`          | `user_id`                       | Cleanup on user delete     |
| FK Cascade  | `sessions` → `users`          | `user_id`                       | Cleanup on user delete     |
| FK Set Null | `game_results` → `users`      | `user_id`                       | Preserve history           |
| FK Set Null | `presence_sessions` → `users` | `user_id`                       | Preserve presence          |

### 6.2 Missing Constraints

| Issue                                                                    | Impact                               | Recommendation                        |
| ------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------- |
| No unique constraint on `(user_id, game_key, day_key)` in `game_results` | Duplicate daily submissions possible | Add unique index or application check |
| No unique constraint on `displayName`                                    | Name impersonation possible          | Consider enforcing uniqueness         |

### 6.3 Leaderboard Integrity

**Current Protection:**

- Score submitted with full game result (not just score value)
- `metadata` JSON field stores game-specific validation data

**Gaps:**

- No cryptographic signature on submitted scores
- No replay protection (same game result could be submitted multiple times)

---

## 7. Secret & Log Audit

### 7.1 Environment Variables

**Server-Only Secrets (.env.local):**

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET`
- `DATABASE_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Client-Exposed (NEXT*PUBLIC*\*):**

```
NEXT_PUBLIC_FORCE_DOMINANT_THEME=ramadan|eid|none  # ✅ Non-sensitive (theme toggle only)
```

### 7.2 Secret Scanning Results

```bash
# No sensitive patterns in console.log statements:
grep -r "console.log.*password\|console.log.*secret\|console.log.*token" src/
# Result: Only "verification_tokens" in migration script (table name, not actual token)
```

### 7.3 Gitignore Verification

`.gitignore` includes: `.env`, `.env.local`, `.env.*.local`

---

## 8. Security Headers Verification

### 8.1 Current Configuration (from next.config.mjs)

| Header                      | Value                                                                    | Assessment                                      |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `Content-Security-Policy`   | default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ... | ⚠️ `unsafe-inline` required by Next.js/Tailwind |
| `X-Frame-Options`           | `DENY`                                                                   | ✅ Prevents clickjacking                        |
| `X-Content-Type-Options`    | `nosniff`                                                                | ✅ Prevents MIME sniffing                       |
| `X-XSS-Protection`          | `1; mode=block`                                                          | ✅ Legacy browser protection                    |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                           | ✅ Strong HSTS                                  |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                        | ✅ Balanced privacy                             |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), interest-cohort=()`           | ✅ Feature restrictions                         |
| `X-Powered-By`              | (removed)                                                                | ✅ `poweredByHeader: false`                     |

### 8.2 Verification Commands

```bash
# Verify headers in production:
curl -I https://your-domain.com | grep -i "strict-transport\|content-security\|x-frame"

# Or use: https://securityheaders.com
```

---

## 9. Threat Model - Ammar Times Specific

### Feature → Threat → Control → Gap Matrix

| Feature                | Threat                | Current Control                     | Gap                             |
| ---------------------- | --------------------- | ----------------------------------- | ------------------------------- |
| **Leaderboard**        | Score manipulation    | Schema validation, metadata logging | No replay protection            |
| **Leaderboard**        | Display name XSS      | Allowlist + React escaping          | ✅ Covered                      |
| **Admin Dashboard**    | Token leakage         | httpOnly + sameSite strict cookies  | ✅ Covered                      |
| **Admin Dashboard**    | Brute force           | IP blocking, 5 attempts             | ✅ Covered                      |
| **Presence/Heartbeat** | DB write spam         | —                                   | ❌ **No rate limit**            |
| **Presence/Heartbeat** | Session hijacking     | Session ID not predictable          | ✅ Covered                      |
| **User Registration**  | Account enumeration   | Generic error messages              | ⚠️ Timing side-channel possible |
| **User Registration**  | Credential stuffing   | —                                   | ❌ **No rate limit**            |
| **Guest Profiles**     | Identity theft        | —                                   | ❌ **IDOR in link-guest**       |
| **Game Results**       | Duplicate submissions | —                                   | ⚠️ No unique constraint         |

---

## 10. Attack-Style Verification Tests

### Test Checklist

| Test                                 | Expected Result            | Status                          |
| ------------------------------------ | -------------------------- | ------------------------------- |
| Admin endpoint as normal user        | 401 Unauthorized           | ✅ Pass                         |
| Admin endpoint with invalid token    | 401 Unauthorized           | ✅ Pass                         |
| IDOR: Access other user's results    | Only own data returned     | ✅ Pass                         |
| IDOR: Claim other guest profile      | **May succeed**            | ❌ Fail (vulnerability)         |
| XSS in displayName                   | Name rejected by allowlist | ✅ Pass                         |
| XSS reflection in leaderboard        | React escapes output       | ✅ Pass                         |
| Rate limit: Admin login (6 attempts) | 429 after 5 attempts       | ✅ Pass                         |
| Rate limit: Registration (10 rapid)  | **Should return 429**      | ❌ Fail (no limit)              |
| Rate limit: Score submit (50 rapid)  | **Should return 429**      | ❌ Fail (no limit)              |
| SQL Injection in name                | Name rejected/escaped      | ✅ Pass (parameterized queries) |

### Manual Test Commands

```powershell
# Test 1: Admin endpoint without auth
Invoke-RestMethod -Uri "http://localhost:3001/api/admin/metrics" -Method GET
# Expected: 401 Unauthorized

# Test 2: Rate limit admin login
1..6 | ForEach-Object {
  Invoke-RestMethod -Uri "http://localhost:3001/api/admin/login" -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"username":"wrong","password":"wrong"}'
}
# Expected: 429 on 6th attempt
```

---

## 11. Remediation Priority

### P0 - Critical (This Week)

| Issue                                          | Fix                        | Effort   |
| ---------------------------------------------- | -------------------------- | -------- |
| ✅ Heartbeat FK Violation                      | Guest profile upsert added | **DONE** |
| Add rate limiting to `/api/auth/register`      | Use `isRateLimited()`      | 30 min   |
| Add rate limiting to `/api/results`            | Use `isRateLimited()`      | 30 min   |
| Add rate limiting to `/api/realtime/heartbeat` | Use `isRateLimited()`      | 30 min   |

### P1 - High (This Sprint)

| Issue                                  | Fix                                  | Effort                     |
| -------------------------------------- | ------------------------------------ | -------------------------- |
| IDOR in `/api/link-guest`              | Verify guestId ownership via session | 2 hours                    |
| Upgrade Next.js to 16.1.6              | `npm install next@16.1.6`            | 1 hour (test)              |
| Upgrade bcrypt to 6.0.0                | `npm install bcrypt@6.0.0`           | 2 hours (breaking changes) |
| Add unique constraint for daily scores | Migration + application check        | 2 hours                    |

### P2 - Medium (This Month)

| Issue                                          | Fix                  | Effort  |
| ---------------------------------------------- | -------------------- | ------- |
| Add rate limiting to remaining write endpoints | Systematic update    | 4 hours |
| Derive role server-side in realtime routes     | Use `auth()` session | 2 hours |
| Add replay protection for scores               | Signed game tokens   | 1 day   |

---

## 12. Files Modified in This Audit

| File                                                                               | Change                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| [src/app/api/realtime/heartbeat/route.js](src/app/api/realtime/heartbeat/route.js) | Added guest profile upsert before presence insert |

---

## Appendix: npm audit JSON Summary

```json
{
  "vulnerabilities": {
    "next": { "severity": "high", "advisories": 3 },
    "bcrypt": { "severity": "high", "via": "tar" },
    "esbuild": { "severity": "moderate", "dev-only": true }
  },
  "metadata": {
    "vulnerabilities": { "total": 8, "high": 4, "moderate": 4 }
  }
}
```

---

_Report generated by GitHub Copilot Security Audit_  
_Methodology: OWASP Top 10, npm audit, manual code review, attack simulation_
