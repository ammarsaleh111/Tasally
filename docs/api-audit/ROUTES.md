# API Routes Inventory

Last updated: 2026-02-06

## Overview
This document lists all API routes in the Ammar Times application with their methods, authentication requirements, request/response schemas, and expected error cases.

---

## Public Routes (No Auth Required)

### Health Check
- **Path**: `/api/health`
- **Method**: `GET`
- **Auth**: No
- **Description**: Health check endpoint for monitoring database connectivity
- **Request**: None
- **Success Response**: 
  ```json
  {
    "ok": true,
    "data": {
      "status": "healthy" | "degraded" | "unhealthy",
      "timestamp": "ISO-8601",
      "version": "1.0.0",
      "uptime": 123,
      "checks": {
        "database": { "status": "ok" | "error", "latencyMs": 25 }
      }
    }
  }
  ```
- **Error Cases**:
  - 503: Database unavailable

### Theme Settings
- **Path**: `/api/theme/settings`
- **Method**: `GET`
- **Auth**: No
- **Description**: Get current theme configuration
- **Request**: None
- **Success Response**:
  ```json
  {
    "activeDominantTheme": "ramadan" | "eid" | null,
    "useSchedule": true,
    "ramadanStart": "2026-02-28",
    "ramadanEnd": "2026-03-29",
    "...": "..."
  }
  ```
- **Error Cases**:
  - 500: Server error (returns defaults)

### Word Definition
- **Path**: `/api/word-definition`
- **Method**: `GET`
- **Auth**: No
- **Description**: Get word definition from dictionaries
- **Request**: Query param `word`
- **Success Response**:
  ```json
  {
    "word": "CRANE",
    "definition": "A large, tall wading bird...",
    "partOfSpeech": "noun",
    "source": "freedictionary",
    "found": true
  }
  ```
- **Error Cases**:
  - 400: Missing word parameter

### Word Validation
- **Path**: `/api/word-validation`
- **Method**: `POST`
- **Auth**: No
- **Description**: Validate if word exists in dictionary
- **Request Body**:
  ```json
  { "word": "crane" }
  ```
- **Success Response**:
  ```json
  { "valid": true, "source": "local" | "wordnik" | "cache" }
  ```
- **Error Cases**:
  - 400: Invalid input
  - 429: Rate limited (20/min per IP)

### Online Count
- **Path**: `/api/presence/online-count`
- **Method**: `GET`
- **Auth**: No
- **Description**: Get count of currently online users
- **Request**: None
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "onlineCount": 42,
      "windowSeconds": 120,
      "computedAt": "ISO-8601",
      "cached": false
    }
  }
  ```
- **Error Cases**:
  - 500: Database error

---

## Authentication Routes

### NextAuth Handlers
- **Path**: `/api/auth/[...nextauth]`
- **Methods**: `GET`, `POST`
- **Auth**: Varies
- **Description**: NextAuth.js authentication handlers
- **Request**: Varies by provider
- **Success Response**: Varies
- **Error Cases**: Varies by provider

### Register
- **Path**: `/api/auth/register`
- **Method**: `POST`
- **Auth**: No
- **Description**: Register new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Display Name" // optional
  }
  ```
- **Success Response** (201):
  ```json
  { "ok": true, "data": { "id": "user-uuid" } }
  ```
- **Error Cases**:
  - 400: Invalid input (email/password format)
  - 409: Email already registered
  - 429: Rate limited (5/min per IP)
  - 500: Database error

### Admin Login
- **Path**: `/api/admin/login`
- **Methods**: `GET`, `POST`, `DELETE`
- **Auth**: No (creates session)
- **Description**: Admin authentication
- **GET Request**: None → Returns `{ authenticated: boolean }`
- **POST Request Body**:
  ```json
  { "username": "admin", "password": "password" }
  ```
- **POST Success Response**:
  ```json
  { "success": true }
  ```
- **DELETE Request**: None → Logs out
- **Error Cases**:
  - 400: Invalid credentials
  - 401: Wrong credentials
  - 429: IP blocked (too many failed attempts)

---

## User Routes (Requires Authentication)

### Submit Game Result
- **Path**: `/api/results`
- **Method**: `POST`
- **Auth**: Yes (user or guest)
- **Description**: Submit game result for scoring
- **Request Body**:
  ```json
  {
    "gameKey": "wordle",
    "mode": "daily" | "practice" | "unlimited",
    "success": true,
    "attempts": 3,
    "durationMs": 45000,
    "metadata": {},
    "guestId": "uuid", // optional (if guest)
    "displayName": "Player", // optional
    "idempotencyKey": "unique-key" // optional
  }
  ```
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": { "id": "result-uuid", "score": 850 }
  }
  ```
- **Error Cases**:
  - 400: Invalid payload, invalid display name, missing guest ID
  - 409: Already submitted today (daily mode), duplicate submission
  - 429: Rate limited (10/min per user/guest)
  - 500: Database error

### Link Guest Account
- **Path**: `/api/link-guest`
- **Method**: `POST`
- **Auth**: Yes (user)
- **Description**: Link guest profile to authenticated user
- **Request Body**:
  ```json
  { "guestId": "guest-uuid" }
  ```
- **Success Response**:
  ```json
  { "ok": true, "data": { "linked": true } }
  ```
- **Error Cases**:
  - 400: Invalid guest ID
  - 401: Unauthorized (not logged in)
  - 404: Guest profile not found
  - 429: Rate limited (5/day per user)
  - 500: Database error

### Presence Heartbeat
- **Path**: `/api/presence/heartbeat`
- **Method**: `POST`
- **Auth**: Yes (user)
- **Description**: Update user online status
- **Request**: None
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "ok": true,
      "updated": true,
      "serverTime": "ISO-8601"
    }
  }
  ```
- **Error Cases**:
  - 401: Unauthorized
  - 429: Rate limited (2/min per user)
  - 500: Internal error

### Daily Leaderboard
- **Path**: `/api/leaderboard/daily`
- **Method**: `GET`
- **Auth**: Yes (user)
- **Description**: Get daily leaderboard for a game
- **Request Query**:
  - `game` (default: wordle)
  - `date` (optional, format: YYYY-MM-DD)
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "date": "2026-02-06",
      "game": "wordle",
      "leaderboard": [
        {
          "rank": 1,
          "playerName": "Player",
          "score": 1000,
          "success": true,
          "attempts": 3,
          "durationMs": 45000
        }
      ],
      "cached": false
    }
  }
  ```
- **Error Cases**:
  - 400: Invalid game key, invalid date
  - 401: Unauthorized
  - 429: Rate limited (30/min per user)
  - 500: Database error

### Monthly Leaderboard
- **Path**: `/api/leaderboard/monthly`
- **Method**: `GET`
- **Auth**: Yes (user)
- **Description**: Get monthly leaderboard for a game
- **Request Query**:
  - `game` (default: wordle)
  - `month` (optional, format: YYYY-MM)
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "month": "2026-02",
      "game": "wordle",
      "leaderboard": [
        {
          "rank": 1,
          "playerName": "Player",
          "totalScore": 25000,
          "gamesPlayed": 28
        }
      ],
      "cached": false
    }
  }
  ```
- **Error Cases**:
  - 400: Invalid game key, invalid month format
  - 401: Unauthorized
  - 429: Rate limited (30/min per user)
  - 500: Database error

### Delete Account
- **Path**: `/api/account/delete`
- **Method**: `DELETE`
- **Auth**: Yes (user)
- **Description**: Delete user account and all associated data
- **Request**: None
- **Success Response**:
  ```json
  { "ok": true, "data": { "ok": true } }
  ```
- **Error Cases**:
  - 401: Unauthorized
  - 429: Rate limited (1/hour per user)
  - 500: Database error

---

## Admin Routes (Requires Admin Auth)

### Admin Metrics
- **Path**: `/api/admin/metrics`
- **Method**: `GET`
- **Auth**: Yes (admin)
- **Description**: Get comprehensive platform metrics
- **Request**: None
- **Success Response**:
  ```json
  {
    "totalPlayers": 1500,
    "totalWinsOverall": 12000,
    "metrics": {
      "activePlayers": 42,
      "activeGames": 15,
      "gameDistribution": { "wordle": 10, "connections": 5 }
    },
    "...": "..."
  }
  ```
- **Error Cases**:
  - 401: Unauthorized
  - 500: Database error

### Admin Users List
- **Path**: `/api/admin/users`
- **Methods**: `GET`, `DELETE`
- **Auth**: Yes (admin)
- **Description**: Get users list or delete user
- **GET Query**: `query` (optional search string)
- **GET Success**:
  ```json
  {
    "ok": true,
    "data": {
      "users": [
        {
          "id": "uuid",
          "displayName": "Player",
          "createdAt": "ISO-8601",
          "lastSeenAt": "ISO-8601",
          "totalWins": 42
        }
      ]
    }
  }
  ```
- **DELETE Query**: `userId` or `guestId`
- **DELETE Success**:
  ```json
  { "ok": true, "data": { "ok": true } }
  ```
- **Error Cases**:
  - 400: Missing userId or guestId (DELETE)
  - 401: Unauthorized
  - 403: Forbidden (trying to delete admin)
  - 500: Database error

### Admin Delete User by ID
- **Path**: `/api/admin/users/[id]`
- **Method**: `DELETE`
- **Auth**: Yes (admin)
- **Description**: Delete specific user by ID
- **Request**: URL param `id`
- **Success Response**:
  ```json
  { "ok": true, "data": { "ok": true } }
  ```
- **Error Cases**:
  - 400: Missing userId
  - 401: Unauthorized
  - 403: Forbidden (trying to delete admin)
  - 404: User not found
  - 500: Database error

### Admin Active Users
- **Path**: `/api/admin/active-users`
- **Method**: `GET`
- **Auth**: Yes (admin)
- **Description**: Get currently active users (last 5 minutes)
- **Request**: None
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "activeUsers": [
        {
          "id": "uuid",
          "displayName": "Player",
          "lastSeenAt": "ISO-8601",
          "currentActivity": "Playing: Wordle",
          "status": "ONLINE",
          "state": "PLAYING",
          "currentGameKey": "wordle"
        }
      ],
      "lastUpdated": "ISO-8601"
    }
  }
  ```
- **Error Cases**:
  - 401: Unauthorized
  - 500: Database error

### Admin Online Users
- **Path**: `/api/admin/online-users`
- **Method**: `GET`
- **Auth**: Yes (admin)
- **Description**: Get list of online users with minimal info
- **Request Query**: `limit` (default: 50, max: 200)
- **Success Response**:
  ```json
  {
    "ok": true,
    "data": {
      "onlineUsers": [
        {
          "userId": "uuid",
          "username": "Player",
          "displayName": "Player Name",
          "lastSeenAt": "ISO-8601",
          "ageSeconds": 45
        }
      ],
      "totalOnline": 42,
      "windowMinutes": 3,
      "lastUpdated": "ISO-8601"
    }
  }
  ```
- **Error Cases**:
  - 401: Unauthorized
  - 500: Database error

### Admin Theme Management
- **Path**: `/api/admin/theme`
- **Methods**: `GET`, `PUT`, `POST`
- **Auth**: Yes (admin)
- **Description**: Manage platform themes
- **GET Success**:
  ```json
  {
    "id": "main",
    "activeDominantTheme": "ramadan",
    "useSchedule": true,
    "...": "..."
  }
  ```
- **PUT Request**:
  ```json
  {
    "activeDominantTheme": "ramadan" | "eid" | null,
    "useSchedule": true,
    "ramadanStart": "2026-02-28",
    "...": "..."
  }
  ```
- **POST Request** (quick actions):
  ```json
  { "action": "activate" | "deactivate" | "enable-schedule", "theme": "ramadan" | "eid" }
  ```
- **Error Cases**:
  - 400: Invalid theme, invalid date format, string too long
  - 401: Unauthorized
  - 500: Database error

---

## Legacy/Internal Routes (File-backed, for backward compat)

### Players
- **Path**: `/api/players`
- **Methods**: `GET`, `POST`, `DELETE`
- **Auth**: No (but rate limited)
- **Description**: File-backed player data (legacy)
- **Error Cases**:
  - 400: Invalid input
  - 404: Player not found (DELETE)
  - 413: Payload too large
  - 429: Rate limited (30/min per IP)
  - 500: Server error

### Activity
- **Path**: `/api/activity`
- **Methods**: `GET`, `POST`
- **Auth**: No (but rate limited)
- **Description**: File-backed activity tracking (legacy)
- **Error Cases**:
  - 400: Invalid input
  - 413: Payload too large
  - 429: Rate limited (50/min per IP)
  - 500: Server error

### Realtime Stream
- **Path**: `/api/realtime/stream`
- **Method**: `GET`
- **Auth**: No (but rate limited)
- **Description**: SSE stream for admin dashboard
- **Error Cases**:
  - 429: Too many connections per IP (max 3)

### Realtime Poll
- **Path**: `/api/realtime/poll`
- **Method**: `GET`
- **Auth**: No
- **Description**: Polling fallback for SSE
- **Error Cases**:
  - 500: Server error

### Realtime Heartbeat
- **Path**: `/api/realtime/heartbeat`
- **Method**: `POST`
- **Auth**: No (but rate limited)
- **Description**: Session heartbeat (legacy, use /api/presence/heartbeat)
- **Error Cases**:
  - 400: Missing sessionId
  - 410: Account deleted
  - 429: Rate limited (60/min per session)
  - 500: Internal error

### Realtime Telemetry
- **Path**: `/api/realtime/telemetry`
- **Methods**: `GET`, `POST`
- **Auth**: No (but rate limited)
- **Description**: Game telemetry events
- **Error Cases**:
  - 400: Missing game or eventType
  - 429: Rate limited (30/min per session)
  - 500: Internal error

---

## Summary Statistics

- **Total Routes**: 26
- **Public Routes**: 7
- **Auth Required**: 10
- **Admin Only**: 7
- **Legacy/Internal**: 7
- **HTTP Methods**: GET (17), POST (14), DELETE (6), PUT (1)
