# API Error Test Plan

Last updated: 2026-02-06

## Overview
This document outlines the test plan for validating error handling across all API endpoints in Ammar Times.

---

## Test Categories

### 1. Authentication & Authorization Errors

#### 401 UNAUTHORIZED Tests
Routes: All authenticated routes

**Test Cases**:
- [ ] Missing session cookie
- [ ] Expired session
- [ ] Invalid session token
- [ ] Guest trying to access user-only route
- [ ] Guest trying to access admin route

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Login required"
  }
}
```

#### 403 FORBIDDEN Tests
Routes: All admin routes

**Test Cases**:
- [ ] Regular user trying to access admin route
- [ ] Trying to delete admin account
- [ ] Invalid admin session

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden"
  }
}
```

---

### 2. Validation Errors

#### 400 BAD REQUEST Tests
Routes: All POST/PUT routes with request bodies

**Test Cases**:
- [ ] Missing required fields
- [ ] Invalid JSON body
- [ ] Invalid field types (string instead of number)
- [ ] Out-of-range values
- [ ] Invalid enum values

**Example Routes to Test**:
- POST /api/results
- POST /api/auth/register
- PUT /api/admin/theme
- POST /api/admin/theme

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "issues": {...} } // Dev only
  }
}
```

#### 422 UNPROCESSABLE ENTITY Tests
Routes: Routes with complex validation

**Test Cases**:
- [ ] Invalid email format
- [ ] Password too short
- [ ] Display name with invalid characters
- [ ] Invalid date format
- [ ] Invalid game key
- [ ] Invalid mode value

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload",
    "details": {...} // Zod validation issues
  }
}
```

---

### 3. Resource Errors

#### 404 NOT FOUND Tests
Routes: Resource-specific endpoints

**Test Cases**:
- [ ] GET /api/admin/users/[id] with non-existent ID
- [ ] POST /api/link-guest with non-existent guest ID
- [ ] DELETE /api/admin/users with non-existent user

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Not found" | "User not found" | "Guest profile not found"
  }
}
```

---

### 4. Conflict Errors

#### 409 CONFLICT Tests
Routes: POST /api/results, POST /api/auth/register

**Test Cases**:
- [ ] Submit daily result twice (same day)
- [ ] Register with existing email
- [ ] Duplicate idempotency key

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "CONFLICT",
    "message": "Already submitted today" | "Email already registered" | "Duplicate submission"
  }
}
```

---

### 5. Rate Limiting

#### 429 TOO MANY REQUESTS Tests
Routes: All routes with rate limiting

**Rate Limits**:
- POST /api/auth/register: 5/min per IP
- POST /api/results: 10/min per user/guest
- POST /api/presence/heartbeat: 2/min per user
- POST /api/link-guest: 5/day per user
- DELETE /api/account/delete: 1/hour per user
- GET /api/leaderboard/*: 30/min per user

**Test Cases**:
- [ ] Exceed rate limit for each endpoint
- [ ] Verify Retry-After header
- [ ] Verify X-RateLimit-* headers

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": { "retryAfter": 45 }
  }
}
```

**Expected Headers**:
```
Retry-After: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-02-06T12:34:56.789Z
```

---

### 6. Server Errors

#### 500 INTERNAL SERVER ERROR Tests
Routes: All routes

**Test Cases** (requires mocking):
- [ ] Database connection failure
- [ ] Transaction rollback
- [ ] Unhandled exception

**Expected Response**:
```json
{
  "ok": false,
  "error": {
    "code": "INTERNAL_ERROR" | "DB_ERROR",
    "message": "Internal server error" | "Failed to save result"
  }
}
```

#### 503 SERVICE UNAVAILABLE Tests
Routes: GET /api/health

**Test Cases**:
- [ ] Database unreachable
- [ ] External service down

**Expected Response**:
```json
{
  "status": "unhealthy",
  "checks": {
    "database": { "status": "error" }
  }
}
```

---

## Test Execution Plan

### Phase 1: Manual Testing
- [ ] Create test accounts (user, admin, guest)
- [ ] Test each error case manually via Postman/Thunder Client
- [ ] Document actual responses vs expected
- [ ] Flag inconsistencies

### Phase 2: Automated Testing
- [ ] Write API smoke tests for happy paths
- [ ] Write error tests for each category
- [ ] Add integration tests for complex flows
- [ ] Set up CI/CD pipeline

### Phase 3: Load Testing
- [ ] Test rate limiting under load
- [ ] Verify concurrent request handling
- [ ] Check database connection pooling

---

## Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Happy Path | 100% |
| Auth Errors (401, 403) | 100% |
| Validation Errors (400, 422) | 90% |
| Not Found (404) | 100% |
| Conflicts (409) | 100% |
| Rate Limits (429) | 100% |
| Server Errors (500) | 80% (mocked) |

---

## Test Data Requirements

### Test Users
- Regular user: test@example.com
- Admin user: admin credentials from env
- Guest: Generate UUID

### Test Game Results
- Valid wordle result (win)
- Valid wordle result (loss)
- Invalid game key
- Out-of-range attempts

### Test Dates
- Today (should succeed for daily)
- Yesterday (should conflict for daily)
- Invalid format (should fail validation)

---

## Known Edge Cases

1. **Timezone Handling**: Daily puzzles use UTC date, test across timezones
2. **Concurrent Submissions**: Test race condition for daily results
3. **Session Expiry**: Test mid-request expiry scenarios
4. **File-backed Routes**: Test /api/players and /api/activity independently
5. **SSE Streams**: Test /api/realtime/stream connection limits

---

## Success Criteria

- ✅ All routes return correct HTTP status codes
- ✅ All error responses follow standard `{ ok: false, error: {...} }` format
- ✅ No sensitive information leaked in error messages
- ✅ Rate limiting works correctly
- ✅ Auth checks are consistent
- ✅ Client can route errors appropriately

---

## Next Steps

1. Implement automated test suite (tests/api/)
2. Add smoke test script (scripts/api-smoke.ts)
3. Update package.json with test commands
4. Document test results in REPORT.md
