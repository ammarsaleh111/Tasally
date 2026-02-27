# Error Experience System

## Overview

Ammar Times now has a comprehensive, branded error handling system that provides user-friendly error pages while maintaining security (no sensitive data leakage in production).

## Files Created

### Global Error Pages (`src/app/`)

| File               | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `not-found.tsx`    | 404 page for missing routes                   |
| `error.tsx`        | Runtime error boundary (catches most errors)  |
| `global-error.tsx` | Root-level fallback (catches layout failures) |

### Route-Level Error Boundaries

| File                    | Purpose                                |
| ----------------------- | -------------------------------------- |
| `admin/error.tsx`       | Admin panel specific errors            |
| `games/error.tsx`       | Games route errors with game shortcuts |
| `leaderboard/error.tsx` | Leaderboard fetch errors               |

### API Utilities (`src/lib/`)

| File           | Purpose                                  |
| -------------- | ---------------------------------------- |
| `apiErrors.ts` | Standardized API error responses         |
| `fetcher.ts`   | Frontend fetch wrapper with typed errors |

---

## Features

### User Experience

✅ **Branded Design** - Uses theme CSS variables (`--accent`, `--foreground`, etc.)  
✅ **Helpful Messages** - Clear, friendly language explaining what happened  
✅ **Multiple Recovery Options** - "Try Again", "Go Back", "Home", "Games" buttons  
✅ **Error IDs** - Unique reference codes for support/debugging  
✅ **Context-Specific** - Different messaging for admin, games, leaderboard  
✅ **Game Quick Links** - Games error page shows popular game shortcuts

### Security

✅ **No Stack Traces** - Error details hidden in production  
✅ **Dev-Only Details** - Full error messages shown only in development  
✅ **Request IDs** - API errors include `X-Request-Id` header for log correlation

### Accessibility

✅ **ARIA Labels** - All interactive elements properly labeled  
✅ **Semantic HTML** - Proper heading hierarchy and landmarks  
✅ **Keyboard Navigation** - All buttons/links keyboard accessible  
✅ **Descriptive Emojis** - `role="img"` with `aria-label` for icons

---

## API Error Helpers

```typescript
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  serviceUnavailable,
} from "@/lib/apiErrors";

// Usage in API routes
export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return badRequest("User ID is required");
  }

  const user = await getUser(userId);
  if (!user) {
    return notFound("User not found");
  }

  return ok({ user });
}
```

### Response Format

```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "requestId": "req_abc123_xyz789"
}
```

### Headers

- `X-Request-Id` - Unique request identifier
- `Retry-After` - Seconds until retry (for 429/503)

---

## Frontend Fetch Wrapper

```typescript
import { fetcher, get, post, safeFetch, ApiError } from "@/lib/fetcher";

// Throwing style (for error boundaries)
try {
  const data = await get("/api/user/123");
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isRateLimited) {
      console.log(`Retry after ${error.retryAfter} seconds`);
    }
  }
}

// Safe style (returns { data, error })
const { data, error } = await safeFetch("/api/user/123");
if (error) {
  console.log(error.message, error.requestId);
}
```

### Error Properties

```typescript
class ApiError {
  status: number; // HTTP status code
  code: string; // Error code (e.g., "RATE_LIMITED")
  message: string; // Error message
  requestId: string; // For support reference
  retryAfter: number; // Seconds (for rate limits)

  // Convenience getters
  isUnauthorized: boolean;
  isForbidden: boolean;
  isRateLimited: boolean;
  isServerError: boolean;
  isNotFound: boolean;
}
```

---

## Theme Integration

All error pages use the site's CSS variables:

```css
/* Colors adapt to theme */
hsl(var(--accent))        /* Primary brand color */
hsl(var(--foreground))    /* Text color */
hsl(var(--muted-foreground)) /* Secondary text */
hsl(var(--card))          /* Card background */
hsl(var(--border))        /* Border color */
hsl(var(--destructive))   /* Error highlight */
hsl(var(--secondary))     /* Secondary button bg */
```

This means error pages automatically adapt to:

- Dark/Light mode toggle
- Seasonal themes (spring, summer, autumn, winter)
- Dominant themes (Ramadan, Eid, etc.)

---

## Error ID Format

| Prefix   | Source                             |
| -------- | ---------------------------------- |
| `err_`   | Global error boundary              |
| `fatal_` | Global error (root layout failure) |
| `admin_` | Admin route errors                 |
| `game_`  | Games route errors                 |
| `lb_`    | Leaderboard route errors           |
| `req_`   | API request errors                 |

Example: `game_m5abc12_x7z9`

---

## Testing

### Test 404 Page

Navigate to any non-existent URL:

```
http://localhost:3002/this-does-not-exist
```

### Test Error Boundary

Add a component that throws an error:

```tsx
"use client";
export default function Broken() {
  throw new Error("Test error");
  return null;
}
```

### Test API Errors

Check API routes return proper error format:

```bash
curl -X POST http://localhost:3002/api/submit \
  -H "Content-Type: application/json" \
  -d '{}' \
  -i
```

---

## Design Decisions

1. **global-error.tsx uses inline styles** - Because it catches failures in the root layout itself, CSS/theme providers may have failed. Inline styles ensure the fallback always works.

2. **Error IDs are client-generated** - Provides instant reference for users without requiring server round-trips.

3. **Copy-to-clipboard for Error ID** - One-click copying for easy support requests.

4. **Dev-only error details** - Balances debugging convenience with production security.

5. **Route-specific messaging** - Admin errors mention re-authentication, game errors reassure about progress saving, leaderboard errors mention eventual consistency.

---

## Future Enhancements

- [ ] Sentry/error reporting integration
- [ ] Error rate dashboards
- [ ] Custom illustrations per error type
- [ ] Offline/network error detection
- [ ] Error recovery suggestions based on error type
