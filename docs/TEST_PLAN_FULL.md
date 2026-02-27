# Ammar Times — Comprehensive Test Plan

**Version:** 1.0  
**Date:** February 27, 2026  
**Platform:** Next.js 16.1.1 / React 19.2 / Neon PostgreSQL  
**Total Test Cases:** 350+

---

## Table of Contents

1. [Test Strategy & Approach](#1-test-strategy--approach)
2. [Environment Setup](#2-environment-setup)
3. [Build & Startup Tests](#3-build--startup-tests)
4. [Game Tests (9 Games)](#4-game-tests-9-games)
5. [Theme Engine Tests (7 Themes)](#5-theme-engine-tests-7-themes)
6. [Achievement System Tests (48 Badges)](#6-achievement-system-tests-48-badges)
7. [Authentication & Identity Tests](#7-authentication--identity-tests)
8. [API Route Tests (~45 Endpoints)](#8-api-route-tests-45-endpoints)
9. [Groups & Social Tests](#9-groups--social-tests)
10. [Leaderboard Tests](#10-leaderboard-tests)
11. [Onboarding Flow Tests](#11-onboarding-flow-tests)
12. [PWA & Install Tests](#12-pwa--install-tests)
13. [Tutorial System Tests](#13-tutorial-system-tests)
14. [Admin Dashboard Tests](#14-admin-dashboard-tests)
15. [Component Tests (~80 Components)](#15-component-tests-80-components)
16. [Navigation & Routing Tests](#16-navigation--routing-tests)
17. [SEO & Metadata Tests](#17-seo--metadata-tests)
18. [Security Tests](#18-security-tests)
19. [Performance Tests](#19-performance-tests)
20. [Accessibility Tests](#20-accessibility-tests)
21. [Responsive Design Tests](#21-responsive-design-tests)
22. [Data Persistence Tests](#22-data-persistence-tests)
23. [Error Handling Tests](#23-error-handling-tests)
24. [Cross-Browser Tests](#24-cross-browser-tests)

---

## 1. Test Strategy & Approach

### Test Types

| Type | Tool/Method | Coverage |
|------|-------------|----------|
| **Unit** | Vitest / Jest | Utils, scoring, validation, engines |
| **Integration** | Vitest + testing-library | Hooks, components with context |
| **API** | `scripts/api-smoke.ts` + manual | All 45 endpoints |
| **E2E** | Playwright / manual | Full user flows |
| **Visual** | Manual + screenshots | All pages, responsive, themes |
| **Performance** | Lighthouse / `scripts/load-test.js` | Core Web Vitals |
| **Security** | `security-tests.js` + manual | Auth, rate limiting, XSS |
| **Accessibility** | axe DevTools / manual | ARIA, keyboard, contrast |

### Priority Levels

- **P0 — Critical:** Games playable, auth works, data persists
- **P1 — High:** Leaderboards, groups, onboarding, PWA
- **P2 — Medium:** Themes, achievements, admin, tutorials
- **P3 — Low:** SEO, edge cases, visual polish

---

## 2. Environment Setup

### Pre-Requisites

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| ENV-01 | Node.js version | `node --version` | 18+ |
| ENV-02 | Dependencies install | `npm install` | No errors |
| ENV-03 | Env validation | `npm run validate-env` | All required vars present |
| ENV-04 | Database connection | `npm run db:setup` | Migrations apply successfully |
| ENV-05 | `.env.local` exists | Check file | Contains DATABASE_URL, NEXTAUTH_SECRET, etc. |

---

## 3. Build & Startup Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| BLD-01 | Dev server starts | `npm run dev` | Server on localhost:3000, no errors | P0 |
| BLD-02 | Production build | `npm run build` | Exit code 0, no TypeScript errors | P0 |
| BLD-03 | Production server | `npm run build && npm start` | Serves on localhost:3000 | P0 |
| BLD-04 | ESLint passes | `npm run lint` | No errors | P0 |
| BLD-05 | Turbopack dev | `npx next dev --turbopack` | Compiles all routes | P1 |
| BLD-06 | Static generation | Check build output | 66 routes listed, static pages generated | P1 |
| BLD-07 | No console errors | Open homepage in browser | DevTools console is clean | P0 |

---

## 4. Game Tests (9 Games)

### 4.1 Wordle (`/games/wordle`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| WRD-01 | Page loads | Navigate to `/games/wordle` | Game grid renders, keyboard visible | P0 |
| WRD-02 | Daily mode | Select daily mode | Date-based puzzle loads | P0 |
| WRD-03 | Practice mode | Select practice mode | Random puzzle loads | P0 |
| WRD-04 | 4-letter mode | Switch to 4-letter | Grid shows 4 columns | P1 |
| WRD-05 | 5-letter mode | Switch to 5-letter | Grid shows 5 columns | P0 |
| WRD-06 | 6-letter mode | Switch to 6-letter | Grid shows 6 columns | P1 |
| WRD-07 | Valid word input | Type valid 5-letter word, press Enter | Word submits, tiles flip with colors | P0 |
| WRD-08 | Invalid word rejected | Type "zzzzz", press Enter | Toast/shake: "Not a valid word" | P0 |
| WRD-09 | Green tile | Correct letter + correct position | Tile turns green | P0 |
| WRD-10 | Yellow tile | Correct letter + wrong position | Tile turns yellow | P0 |
| WRD-11 | Gray tile | Letter not in word | Tile turns gray | P0 |
| WRD-12 | Keyboard updates | Submit word | Keyboard keys change color | P0 |
| WRD-13 | Win in 1-6 guesses | Guess correct word | Confetti, win modal, stats update | P0 |
| WRD-14 | Lose after 6 | Use all 6 guesses wrong | Loss modal shows correct answer | P0 |
| WRD-15 | Stats persist | Win game, reload page | Statistics show updated data | P0 |
| WRD-16 | Share results | Click share button | Emoji grid copied to clipboard | P1 |
| WRD-17 | Streak tracking | Win 2 consecutive days | Streak increments to 2 | P1 |
| WRD-18 | Word validation 3-layer | Type obscure valid word | Accepted after Wordnik/Datamuse check | P1 |
| WRD-19 | Garbage filter | Type "qbc" | Rejected immediately (no vowel, q-no-u) | P1 |
| WRD-20 | Daily resets at midnight | Check after midnight UTC | New puzzle available | P2 |
| WRD-21 | Already played guard | Complete daily, revisit | Shows completed state, no replay | P0 |

### 4.2 Connections (`/games/connections`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CON-01 | Page loads | Navigate to `/games/connections` | 16 word tiles displayed in grid | P0 |
| CON-02 | Select 4 words | Click 4 tiles | Tiles highlight, "Submit" enabled | P0 |
| CON-03 | Correct group | Submit a valid group | Group revealed with category, color, animation | P0 |
| CON-04 | Wrong group | Submit invalid 4 words | Mistake counter increments, tiles shake | P0 |
| CON-05 | One-away detection | Submit 3 correct + 1 wrong | "One away!" hint appears | P1 |
| CON-06 | 4 mistakes = lose | Make 4 wrong guesses | Game over, all groups revealed | P0 |
| CON-07 | Win all 4 groups | Solve all 4 correctly | Confetti, stats update | P0 |
| CON-08 | Deselect tile | Click selected tile | Tile deselects | P1 |
| CON-09 | Shuffle button | Click shuffle | Remaining tiles rearrange | P1 |
| CON-10 | Difficulty colors | Solve groups | Easy=yellow, medium=green, hard=blue, tricky=purple | P2 |
| CON-11 | Daily puzzle data | Check date match | Correct puzzle for today's date | P0 |
| CON-12 | Share results | Share after game | Emoji grid with colored squares | P1 |

### 4.3 Mini Crossword (`/games/crossword`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CRW-01 | Page loads | Navigate to `/games/crossword` | 5×5 grid + clues render | P0 |
| CRW-02 | Click clue | Click an across clue | Corresponding cells highlight | P0 |
| CRW-03 | Type letter | Type a letter | Cell fills, cursor moves to next | P0 |
| CRW-04 | Arrow keys | Press arrow keys | Direction toggles between across/down | P1 |
| CRW-05 | Backspace | Press backspace | Clears current cell, moves back | P1 |
| CRW-06 | Complete puzzle | Fill all cells correctly | Win celebration, time displayed | P0 |
| CRW-07 | Wrong letter | Fill incorrect letter | No immediate feedback (filled in) | P1 |
| CRW-08 | Progress saves | Fill partial, reload | Progress restored from API/localStorage | P1 |
| CRW-09 | Daily data loads | Check API | `/api/crossword/daily` returns valid puzzle | P0 |
| CRW-10 | Timer runs | Start playing | Timer counts up | P2 |

### 4.4 Numbers (`/games/numbers`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| NUM-01 | Page loads | Navigate to `/games/numbers` | 6 number cards + target number shown | P0 |
| NUM-02 | Select two numbers | Click two number cards | Both highlight | P0 |
| NUM-03 | Apply operator | Click +, −, ×, or ÷ | Result replaces two numbers | P0 |
| NUM-04 | Reach target | Operations produce target | Win modal, score shown | P0 |
| NUM-05 | Undo last step | Click undo | Last operation reversed | P1 |
| NUM-06 | Reset | Click reset | All numbers restored to original | P1 |
| NUM-07 | Division validation | Divide non-evenly | Operation rejected or not available | P1 |
| NUM-08 | Negative result | Subtract larger from smaller | Handled correctly (rejected or shown) | P2 |
| NUM-09 | Practice mode | Switch to practice | Random numbers/target generated | P1 |
| NUM-10 | Close enough | Get within 1-10 of target | Partial score awarded | P2 |

### 4.5 Trivia (`/games/trivia`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| TRV-01 | Page loads | Navigate to `/games/trivia` | First question displayed with 4 options | P0 |
| TRV-02 | Select answer | Click an option | Correct=green, wrong=red, correct highlighted | P0 |
| TRV-03 | 10 questions | Answer all 10 | Final score screen shown | P0 |
| TRV-04 | Perfect score | Answer all 10 correctly | 10/10, achievement possible | P0 |
| TRV-05 | Streak (70%+) | Score 7+/10 | Daily streak increments | P1 |
| TRV-06 | Streak broken | Score <7/10 | Streak resets to 0 | P1 |
| TRV-07 | Timer per question | Start answering | Countdown visible per question | P2 |
| TRV-08 | Category variety | Play multiple days | Questions from different categories | P2 |
| TRV-09 | Themed trivia | Active theme (e.g., Ramadan) | Theme-specific questions appear | P2 |
| TRV-10 | Share results | Share after game | Score summary copied | P1 |

### 4.6 Spelling Bee (`/games/spelling`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SPL-01 | Page loads | Navigate to `/games/spelling` | Honeycomb grid with 7 letters visible | P0 |
| SPL-02 | Click letter | Click hexagonal letter | Letter appends to input | P0 |
| SPL-03 | Must use center | Submit word without center letter | Rejected: "Must include center letter" | P0 |
| SPL-04 | Valid word | Submit valid word using center | Word accepted, score increases | P0 |
| SPL-05 | Minimum 4 letters | Submit 3-letter word | Rejected: "Too short" | P0 |
| SPL-06 | Duplicate word | Submit same word twice | Rejected: "Already found" | P1 |
| SPL-07 | Pangram | Submit word using all 7 letters | Bonus points, pangram animation | P1 |
| SPL-08 | Score levels | Find enough words | Progress through levels (Good→Great→Amazing→Genius→Queen Bee) | P1 |
| SPL-09 | Shuffle letters | Click shuffle | Outer letters rearrange | P1 |
| SPL-10 | Hint system | Check hints | Shows count of remaining words by first letter | P2 |
| SPL-11 | Delete letter | Click delete/backspace | Last letter removed from input | P0 |

### 4.7 Strands (`/games/strands`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| STR-01 | Page loads | Navigate to `/games/strands` | Letter grid visible with theme clue | P0 |
| STR-02 | Select letters | Click/drag letters in grid | Path highlights connecting adjacent cells | P0 |
| STR-03 | Find valid word | Select a themed word | Word highlights permanently, score updates | P0 |
| STR-04 | Invalid selection | Select non-word letters | Path clears | P1 |
| STR-05 | Complete puzzle | Find all themed words | Win state, spangram highlighted | P0 |
| STR-06 | Hint usage | Use a hint | Reveals a letter/word location | P1 |
| STR-07 | No-hint bonus | Complete without hints | Achievement possible | P2 |
| STR-08 | Theme word (spangram) | Find the spanning word | Highlighted differently, spans board | P1 |
| STR-09 | Daily puzzle data | Check data files | `strands-2026-XX.js` loads for current month | P0 |

### 4.8 Waffle (`/games/waffle`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| WAF-01 | Page loads | Navigate to `/games/waffle` | Waffle grid rendered (cross shape) | P0 |
| WAF-02 | Swap letters | Drag/click swap two letters | Letters exchange positions | P0 |
| WAF-03 | Correct placement | Letter in correct spot after swap | Tile turns green | P0 |
| WAF-04 | Complete puzzle | All letters in correct positions | Win celebration, swap count shown | P0 |
| WAF-05 | Swap counter | Make swaps | Counter tracks total swaps | P1 |
| WAF-06 | Optimal solution | Complete in minimum swaps | Star rating / achievement | P2 |
| WAF-07 | Invalid swap | Try swapping locked (green) tile | Swap rejected | P1 |
| WAF-08 | Daily data | Check puzzle data | Correct waffle for today | P0 |

### 4.9 Combinations (`/games/combinations`)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CMB-01 | Page loads | Navigate to `/games/combinations` | UI renders with element slots | P0 |
| CMB-02 | Select elements | Choose elements/fragments | Selection highlights | P0 |
| CMB-03 | Submit combination | Submit selected combo | Correct=success animation, Wrong=error feedback | P0 |
| CMB-04 | Win | Find the correct combination | Victory screen, stats update | P0 |
| CMB-05 | Attempt tracking | Make multiple attempts | Attempts counted and displayed | P1 |
| CMB-06 | Daily data | Check data source | Loads from `month-XX/combinations.json` | P0 |
| CMB-07 | Share results | Share after completion | Result summary clipboard | P1 |

---

## 5. Theme Engine Tests (7 Themes)

### 5.1 Theme Activation

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| THM-01 | No theme outside dates | Set system date outside all ranges | Default styling, no banner | P1 |
| THM-02 | Halloween activates | Set date to Oct 25-31 | Halloween colors, emoji, banner | P2 |
| THM-03 | Christmas activates | Set date to Dec 20-26 | Christmas colors, emoji, banner | P2 |
| THM-04 | Sports Week activates | Set date to Feb 1-7 | Sports theme active | P2 |
| THM-05 | Ramadan activates | Set date to Feb 17 - Mar 18 | Ramadan gold/purple palette, Cairo font | P1 |
| THM-06 | World Cup activates | Set date to Jun 1 - Jul 15 | Football theme active | P2 |
| THM-07 | Music Week activates | Set date to Mar 15-21 | Music theme active | P2 |
| THM-08 | Oscar Week activates | Set date to Mar 1-8 | Film theme active | P2 |

### 5.2 Theme Features

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| THM-09 | Banner displays | Active theme period | Banner shows at top with icon, title, end date | P1 |
| THM-10 | Banner dismissible | Click dismiss (X) on banner | Banner hides for the session/day | P1 |
| THM-11 | Corner decorations | Active theme | SVG corners render in viewport | P2 |
| THM-12 | Background patterns | Active theme | Pattern SVGs fill background | P2 |
| THM-13 | CSS tokens applied | Active theme | `--accent`, `--card`, etc. change | P1 |
| THM-14 | Themed Wordle words | Play Wordle during theme | Theme-specific word list used | P2 |
| THM-15 | Themed trivia | Play Trivia during theme | Theme-specific questions appear | P2 |
| THM-16 | Theme settings API | `GET /api/theme/settings` | Returns current theme config | P2 |
| THM-17 | Admin theme control | Admin dashboard → themes | Can toggle theme override | P3 |
| THM-18 | Season icons | Active theme | Season-specific icons throughout UI | P2 |
| THM-19 | Theme showcase page | `/themes` | Lists all themes with previews | P3 |

---

## 6. Achievement System Tests (48 Badges)

### 6.1 Streak Achievements

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ACH-01 | 3-day streak | Maintain 3-day streak in any game | "Getting Started" badge unlocks | P1 |
| ACH-02 | 7-day streak | 7-day streak | "Week Warrior" unlocks | P1 |
| ACH-03 | 10-day streak | 10-day streak | "10-Day Streak" unlocks | P2 |
| ACH-04 | 30-day streak | 30-day streak | "Monthly Master" unlocks | P2 |
| ACH-05 | 100-day streak | 100-day streak | "Century Club" unlocks | P3 |

### 6.2 Per-Game Achievements (sample per game)

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ACH-06 | Wordle first win | Win first Wordle game | Achievement unlocks | P1 |
| ACH-07 | Wordle perfect | Guess word in 1 attempt | "Lucky Guess" or similar | P2 |
| ACH-08 | Connections perfect | Solve with 0 mistakes | Connections achievement unlocks | P2 |
| ACH-09 | Trivia perfect 10 | Score 10/10 | "Perfect Score" unlocks | P2 |
| ACH-10 | Spelling Bee Queen | Find all words | "Queen Bee" unlocks | P3 |
| ACH-11 | Numbers exact | Hit exact target | Numbers achievement unlocks | P2 |
| ACH-12 | Waffle minimal swaps | Solve in fewest swaps | Waffle achievement unlocks | P2 |
| ACH-13 | Strands no hints | Complete without hints | Strands achievement unlocks | P2 |

### 6.3 General Achievements

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ACH-14 | 100 total games | Play 100 games across all | Milestone achievement | P2 |
| ACH-15 | Play all games | Play each of 9 games once | "Well Rounded" or similar | P2 |
| ACH-16 | Perfect week | Win every game for 7 days | Weekly milestone | P3 |

### 6.4 Badge System

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ACH-17 | Badge notification | Unlock any achievement | Toast notification with badge icon | P1 |
| ACH-18 | Badges page | Visit `/badges` | All 48 badges displayed (locked & unlocked) | P1 |
| ACH-19 | Badge details | Click a badge | Details sheet shows description, unlock date | P2 |
| ACH-20 | Badges drawer | Open badges drawer | Collection shows progress (e.g., "12/48") | P1 |
| ACH-21 | Badge persistence | Unlock badge, reload | Badge remains unlocked | P0 |
| ACH-22 | Badge earned recap | Return after earning badges | Shows recap of newly earned badges | P2 |

---

## 7. Authentication & Identity Tests

### 7.1 Guest Identity

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| AUTH-01 | First visit identity | Open site for first time | `IdentityGate` shows name claim modal | P0 |
| AUTH-02 | Claim display name | Enter name "TestPlayer" | Name saved, identity created via `/api/identity/claim` | P0 |
| AUTH-03 | Arabic display name | Enter name "أحمد" | Arabic name accepted, displayed with Cairo font | P1 |
| AUTH-04 | Name validation | Enter empty name / 1 char | Rejected with validation message | P0 |
| AUTH-05 | Identity persists | Claim name, close tab, reopen | Same identity loaded (httpOnly cookie) | P0 |
| AUTH-06 | Identity lookup | `GET /api/identity/me` | Returns current identity with displayName | P0 |
| AUTH-07 | Rename identity | `POST /api/identity/rename` | Display name updated successfully | P1 |
| AUTH-08 | Find identity | `GET /api/identity/find?name=X` | Returns matching identity if exists | P2 |

### 7.2 Google OAuth

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| AUTH-09 | Login page renders | Navigate to `/login` | Google sign-in button visible | P0 |
| AUTH-10 | Google OAuth flow | Click Google sign-in | Redirects to Google, returns with session | P0 |
| AUTH-11 | Session created | After login | Cookie set, `useSession` returns user data | P0 |
| AUTH-12 | Logout | Click logout | Session cleared, redirected to home | P0 |
| AUTH-13 | Guest link | Login after playing as guest | Guest data linked to authenticated account | P1 |
| AUTH-14 | Link guest API | `POST /api/link-guest` | Guest identity linked to user | P1 |

### 7.3 Credentials Auth

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| AUTH-15 | Register | `POST /api/auth/register` | New user created with hashed password | P1 |
| AUTH-16 | Register validation | Submit empty/short password | Zod validation error returned | P1 |
| AUTH-17 | Duplicate email | Register same email twice | Error: email already taken | P1 |
| AUTH-18 | Credentials login | Login with email/password | Session created | P1 |
| AUTH-19 | Wrong password | Login with wrong password | Error 401 | P1 |

---

## 8. API Route Tests (~45 Endpoints)

### 8.1 Health & System

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-01 | Health check | `GET /api/health` | 200 with `status: "healthy"`, uptime, DB check | P0 |
| API-02 | Health DB down | Kill DB connection | 503 with `status: "unhealthy"` | P1 |
| API-03 | Health no-cache | Check response headers | `Cache-Control: no-store, no-cache, must-revalidate` | P2 |

### 8.2 Results

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-04 | Submit result | `POST /api/results` with valid body | 200, result stored in DB | P0 |
| API-05 | Submit invalid | `POST /api/results` with missing fields | Zod validation error 400 | P0 |
| API-06 | Rate limit results | Send 11 requests in 60s | 11th returns 429 (limit: 10/min) | P1 |

### 8.3 Leaderboard

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-07 | Daily leaderboard | `GET /api/leaderboard/daily?game=wordle` | Returns ranked player list | P0 |
| API-08 | Monthly leaderboard | `GET /api/leaderboard/monthly?game=wordle` | Returns monthly rankings | P1 |
| API-09 | Global leaderboard | `GET /api/leaderboards/global` | Returns all-time rankings | P1 |
| API-10 | Leaderboard rate limit | Send 31 requests in 60s | 31st returns 429 (limit: 30/min) | P2 |

### 8.4 Identity

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-11 | Identity me | `GET /api/identity/me` | Returns current identity | P0 |
| API-12 | Identity claim | `POST /api/identity/claim` | Creates new guest identity | P0 |
| API-13 | Identity rename | `POST /api/identity/rename` | Updates display name | P1 |
| API-14 | Identity find | `GET /api/identity/find?name=X` | Returns matching identity | P2 |
| API-15 | Identity link | `POST /api/identity/link` | Links guest to user account | P1 |
| API-16 | Claim rate limit | 11 claims in 60s | 429 (limit: 10/min) | P2 |

### 8.5 Groups

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-17 | Create group | `POST /api/groups` | Group created with invite code | P0 |
| API-18 | My groups | `GET /api/groups/mine` | Returns user's groups | P0 |
| API-19 | Group detail | `GET /api/groups/[id]` | Returns group info + members | P1 |
| API-20 | Invite player | `POST /api/groups/[id]/invite` | Invite created | P1 |
| API-21 | Kick member | `POST /api/groups/[id]/kick` | Member removed (only owner) | P1 |
| API-22 | Leave group | `POST /api/groups/[id]/leave` | User leaves group | P1 |
| API-23 | Group results | `POST /api/groups/[id]/results` | Game result submitted to group | P1 |
| API-24 | Group leaderboard | `GET /api/groups/[id]/leaderboard-total` | Returns group rankings | P1 |

### 8.6 Invites

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-25 | My invites | `GET /api/invites/mine` | Returns pending invites | P1 |
| API-26 | Accept invite | `POST /api/invites/[id]/respond` body: `{accept: true}` | Joined group | P1 |
| API-27 | Decline invite | `POST /api/invites/[id]/respond` body: `{accept: false}` | Invite declined | P1 |

### 8.7 Admin

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-28 | Admin login | `POST /api/admin/login` | Returns admin session token | P1 |
| API-29 | Admin stats | `GET /api/admin/stats` (auth'd) | Dashboard metrics | P1 |
| API-30 | Admin users | `GET /api/admin/users` (auth'd) | Paginated user list | P1 |
| API-31 | Admin delete user | `DELETE /api/admin/users/[id]` | User deleted | P1 |
| API-32 | Admin unauth | `GET /api/admin/stats` (no token) | 401 Unauthorized | P0 |
| API-33 | Active users | `GET /api/admin/active-users` | Returns active user count | P2 |
| API-34 | Online users | `GET /api/admin/online-users` | Returns currently online users | P2 |
| API-35 | Admin metrics | `GET /api/admin/metrics` | Returns system metrics | P2 |
| API-36 | Admin theme | `GET/POST /api/admin/theme` | Get/set theme override | P2 |

### 8.8 Crossword

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-37 | Daily crossword | `GET /api/crossword/daily` | Returns today's crossword puzzle | P0 |
| API-38 | Save progress | `POST /api/crossword/progress` | Saves grid state | P1 |

### 8.9 Word Services

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-39 | Validate word | `GET /api/word-validation?word=hello` | `{valid: true}` | P0 |
| API-40 | Validate nonword | `GET /api/word-validation?word=zzzzz` | `{valid: false}` | P0 |
| API-41 | Word definition | `GET /api/word-definition?word=hello` | Returns definition | P2 |
| API-42 | Dictionary lookup | `GET /api/dictionary?word=hello` | Returns dictionary entry | P2 |

### 8.10 Presence & Realtime

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-43 | Heartbeat | `POST /api/presence/heartbeat` | 200, session updated | P1 |
| API-44 | Online count | `GET /api/presence/online-count` | Returns number of online players | P1 |
| API-45 | SSE stream | `GET /api/realtime/stream` (EventSource) | Receives SSE events | P2 |
| API-46 | Realtime heartbeat | `POST /api/realtime/heartbeat` | Session updated in store | P2 |
| API-47 | Realtime poll | `GET /api/realtime/poll` | Returns current metrics | P2 |
| API-48 | Telemetry | `POST /api/realtime/telemetry` | Game state updated | P2 |
| API-49 | SSE max connections | Open 4 SSE from same IP | 4th returns 429 (limit: 3/IP) | P2 |

### 8.11 Other

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| API-50 | Activity | `GET /api/activity` | Returns activity feed data | P2 |
| API-51 | Account delete | `DELETE /api/account/delete` | Account and data deleted | P1 |
| API-52 | Account delete rate | 2nd delete in 1 hour | 429 (limit: 1/hour) | P2 |
| API-53 | Players | `GET /api/players` | Returns player data | P2 |
| API-54 | Theme settings | `GET /api/theme/settings` | Returns current theme config | P2 |
| API-55 | Game global results | `GET /api/games/global/results` | Game-wide result aggregates | P2 |

---

## 9. Groups & Social Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| GRP-01 | Groups page | Navigate to `/groups` | Groups list renders | P0 |
| GRP-02 | Create group UI | Click "Create Group" | Modal opens with name input | P0 |
| GRP-03 | Min 2 chars name | Enter "A" → submit | Error: "at least 2 characters" | P1 |
| GRP-04 | Group created | Enter valid name → submit | Group appears in list | P0 |
| GRP-05 | View group | Click group | `/groups/[id]` loads with members, leaderboard | P1 |
| GRP-06 | Invite modal | Click invite | Modal with invite code/link | P1 |
| GRP-07 | Invites page | Navigate to `/groups/invites` | Pending invites displayed | P1 |
| GRP-08 | Accept invite | Accept pending invite | Joined group, appears in "My Groups" | P1 |
| GRP-09 | Group game play | Play game in group context `/groups/[id]/play/[game]` | Result submitted to group | P1 |
| GRP-10 | Group leaderboard | View group page | Ranked member list | P1 |
| GRP-11 | Display name claim | First time in group | Can set display name for this group | P2 |
| GRP-12 | Rename in group | Change display name | Updated in group context | P2 |

---

## 10. Leaderboard Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| LDB-01 | Leaderboard page | Navigate to `/leaderboard` | Page renders with game tabs | P0 |
| LDB-02 | Daily tab | Select daily view | Today's rankings shown | P0 |
| LDB-03 | Monthly tab | Select monthly view | This month's rankings shown | P1 |
| LDB-04 | Game filter | Switch between games | Rankings update per game | P1 |
| LDB-05 | Score display | Submit game result | Score appears on leaderboard | P0 |
| LDB-06 | Ranking order | Multiple scores | Sorted by score descending | P0 |
| LDB-07 | Player name | Leaderboard entry | Shows display name, not ID | P1 |
| LDB-08 | Own rank highlighted | View leaderboard | Current player's row highlighted | P2 |

---

## 11. Onboarding Flow Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ONB-01 | First visit triggers | Clear all storage, visit site | Onboarding flow starts | P0 |
| ONB-02 | Phase 1: Name | First visit | Name entry screen appears | P0 |
| ONB-03 | Name required | Try to skip name | Cannot proceed without name | P0 |
| ONB-04 | Phase 2: Tutorial | After naming | Tutorial flow starts | P0 |
| ONB-05 | Phase 3: Install | After tutorial | Install banner appears (one-time) | P1 |
| ONB-06 | Sequence strict | Try to skip to install | Cannot skip tutorial | P0 |
| ONB-07 | Deep-link protection | Direct link to `/games/wordle` on first visit | Onboarding completes first, then redirects to `/games/wordle` | P0 |
| ONB-08 | Return to route | Complete onboarding after deep-link | Returns to original intended route | P1 |
| ONB-09 | State persists | Complete name step, reload | Resumes at tutorial (not name again) | P0 |
| ONB-10 | Versioned keys | Check localStorage | Keys use `ammar:onboarding:v1:*` prefix | P1 |
| ONB-11 | Completed state | Complete all 3 steps | Flow never shows again | P0 |
| ONB-12 | Hydration safe | SSR render | No hydration mismatch errors | P0 |
| ONB-13 | Session return | Deep-link → onboarding → complete | `sessionStorage` return route used and cleared | P1 |

---

## 12. PWA & Install Tests

### 12.1 PWA Fundamentals

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| PWA-01 | Manifest exists | `GET /manifest.webmanifest` | Valid JSON manifest returned | P0 |
| PWA-02 | Manifest fields | Check manifest content | `name`, `short_name`, `icons`, `start_url`, `display: standalone` | P0 |
| PWA-03 | Service Worker | Check `/sw.js` | SW file exists and is valid JS | P0 |
| PWA-04 | SW registers | DevTools → Application → SW | Service Worker registered and active | P0 |
| PWA-05 | Icons present | Check `/icons/` folder | 192px and 512px icons (regular + maskable) | P1 |
| PWA-06 | Lighthouse PWA audit | Run Lighthouse | Passes "Installable" criteria | P1 |

### 12.2 Install Experience

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| PWA-07 | Hero install button | Visit homepage | Floating install button visible (top-right) | P0 |
| PWA-08 | Header install button | Visit any page | Install button in header | P0 |
| PWA-09 | Install click (Android) | Click install button on Android | Native install prompt appears | P0 |
| PWA-10 | Install click (iOS) | Click install button on iOS | iOS-specific modal with steps | P1 |
| PWA-11 | Hint when unavailable | Click install before `beforeinstallprompt` | "Install becomes available after a short period of use." | P1 |
| PWA-12 | Hint auto-dismiss | Wait after hint shows | Hint disappears after 2.2 seconds | P2 |
| PWA-13 | Hidden when installed | Open as installed PWA | Install buttons not shown | P0 |
| PWA-14 | iOS detection | Open on iPhone/iPad | `isIOS` flag set correctly | P1 |
| PWA-15 | Standalone detection | Open installed PWA | `isInstalled` returns true | P1 |
| PWA-16 | Desktop install | Chrome desktop | Install prompt works | P1 |

---

## 13. Tutorial System Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| TUT-01 | First visit auto-show | First visit to a game | Tutorial panel auto-appears | P1 |
| TUT-02 | Tutorial content | View tutorial | Has relevant game instructions | P1 |
| TUT-03 | Step navigation | Click next/prev in tutorial | Steps advance/go back | P1 |
| TUT-04 | Close tutorial | Click X / outside | Tutorial closes | P1 |
| TUT-05 | Marked as seen | Complete tutorial, revisit | Does NOT auto-show again | P0 |
| TUT-06 | Manual re-open | Click "How it works" or ? button | Tutorial re-opens | P1 |
| TUT-07 | Global tutorial | Home page "How it works" button | Global tutorial panel opens | P1 |
| TUT-08 | State versioned | Check localStorage key | Uses `ammar-times-tutorials-v1` | P2 |
| TUT-09 | State tracks per game | View tutorials for 2 different games | Each tracked separately in `seen` map | P2 |
| TUT-10 | Version migration | Set old version in storage | State resets cleanly to defaults | P3 |

---

## 14. Admin Dashboard Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ADM-01 | Admin login page | Navigate to `/admin/login` | Login form renders | P0 |
| ADM-02 | Valid login | Enter correct admin credentials | Redirected to `/admin` dashboard | P0 |
| ADM-03 | Invalid login | Enter wrong credentials | Error message displayed | P0 |
| ADM-04 | Dashboard renders | `/admin` after login | Stats cards, user table, metrics visible | P0 |
| ADM-05 | Stats polling | Wait 20+ seconds | Stats auto-refresh (poll every 20s) | P1 |
| ADM-06 | Users table | View users section | Paginated list (25 per page) | P1 |
| ADM-07 | User search | Type in search box | Users filtered by name/email (debounced) | P1 |
| ADM-08 | User pagination | Click next/prev page | Page changes, new data loads | P1 |
| ADM-09 | Delete user | Click delete on user | Confirmation dialog with typed input required | P1 |
| ADM-10 | Delete confirmation | Type user name in confirm dialog | Delete button enables, user removed | P1 |
| ADM-11 | Logout | Click admin logout | Session cleared, redirected to login | P1 |
| ADM-12 | Unauth redirect | Visit `/admin` without login | Redirected to `/admin/login` | P0 |
| ADM-13 | Theme management | Navigate to `/admin/themes` | Theme control panel visible | P2 |
| ADM-14 | SSE connection | Dashboard open | Real-time events stream in | P2 |
| ADM-15 | Error handling | Admin API fails | Error state shown, fallback graceful | P2 |

---

## 15. Component Tests (~80 Components)

### 15.1 Core Components

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CMP-01 | GameHeader | Render any game page | Header with game name, back button, menu | P0 |
| CMP-02 | Modal | Trigger any modal | Renders centered, overlay, closes on X/escape/outside | P0 |
| CMP-03 | Toast | Trigger notification | Toast appears, auto-dismisses | P0 |
| CMP-04 | Confetti | Win a game | Confetti animation plays | P1 |
| CMP-05 | PuzzleLoader | Loading state | Skeleton/spinner shown while loading | P1 |
| CMP-06 | SiteHeader | Any page with header | Logo, nav links, auth button, install button | P0 |
| CMP-07 | ShareResults | Win game → share | Emoji summary generated and copied | P1 |
| CMP-08 | StatisticsModal | Open stats in any game | Shows games played, win %, streaks, distribution | P0 |

### 15.2 UI Primitives

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CMP-09 | Button variants | Render each variant | Primary, secondary, outline, ghost styles | P2 |
| CMP-10 | Card component | Render card | Styled container with border, padding | P2 |
| CMP-11 | Input component | Type in input | Value updates, focus styles applied | P2 |
| CMP-12 | Badge component | Render badge | Styled label/chip | P2 |
| CMP-13 | Progress bar | Render with value | Filled bar matching percentage | P2 |
| CMP-14 | Skeleton | Loading state | Animated placeholder elements | P2 |
| CMP-15 | Tabs | Tab switching | Active tab highlighted, content switches | P2 |
| CMP-16 | Tooltip | Hover element | Tooltip appears with content | P2 |

### 15.3 Game Components

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CMP-17 | WordleGrid | Play Wordle | 6×5 grid renders, tiles animate on flip | P0 |
| CMP-18 | Keyboard | Play Wordle | On-screen keyboard, keys color-coded | P0 |
| CMP-19 | ConnectionsGrid | Play Connections | 4×4 grid, selection highlights | P0 |
| CMP-20 | HoneycombGrid | Play Spelling Bee | Hexagonal layout, center letter highlighted | P0 |
| CMP-21 | StrandsGrid | Play Strands | Letter grid with selectable paths | P0 |
| CMP-22 | WaffleGrid | Play Waffle | Cross-shaped grid, swap interaction | P0 |
| CMP-23 | GameResultModal | Complete any game | Shows result, score, share button | P0 |
| CMP-24 | WinConfettiOverlay | Win any game | Full-screen confetti animation | P1 |
| CMP-25 | SolvedStateBanner | Revisit completed game | "Already solved" banner shown | P1 |

### 15.4 Auth Components

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| CMP-26 | AuthButton | Header | Shows "Sign In" or user avatar | P0 |
| CMP-27 | AuthModal | Click sign in | Modal with Google + credentials options | P0 |
| CMP-28 | AuthProvider | App wrapper | Session context available throughout app | P0 |
| CMP-29 | SessionBridge | After login | Session data synced to client state | P1 |
| CMP-30 | SessionInitializer | App startup | Session initialized from cookie | P1 |

---

## 16. Navigation & Routing Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| NAV-01 | Home page | Visit `/` | Home page renders with hero, stats, games | P0 |
| NAV-02 | Games hub | Visit `/games` | All 9 game cards visible | P0 |
| NAV-03 | Each game route | Visit each `/games/[name]` | Each of 9 games loads without error | P0 |
| NAV-04 | Profile page | Visit `/profile` | Player stats, achievements, history | P0 |
| NAV-05 | Badges page | Visit `/badges` | Badge collection renders | P1 |
| NAV-06 | Groups page | Visit `/groups` | Groups list renders | P1 |
| NAV-07 | Leaderboard | Visit `/leaderboard` | Rankings render | P1 |
| NAV-08 | Login page | Visit `/login` | Auth form renders | P1 |
| NAV-09 | How to play | Visit `/how-to-play` | Rules for all games | P1 |
| NAV-10 | Admin pages | Visit `/admin`, `/admin/login`, `/admin/themes` | Each renders correctly | P1 |
| NAV-11 | 404 page | Visit `/nonexistent` | Custom 404 page renders | P1 |
| NAV-12 | Error boundary | Trigger component error | `error.tsx` fallback renders | P2 |
| NAV-13 | Global error | App-level crash | `global-error.tsx` renders | P3 |
| NAV-14 | Back navigation | Browser back button | Returns to previous page correctly | P1 |
| NAV-15 | Deep linking | Direct URL to game | Game loads correctly | P0 |
| NAV-16 | Daily puzzle archive | Visit `/daily-puzzle-archive` | Archive page renders | P2 |
| NAV-17 | Word games landing | Visit `/word-games` | SEO landing page renders | P2 |
| NAV-18 | Puzzle games landing | Visit `/puzzle-games` | SEO landing page renders | P2 |
| NAV-19 | Themes page | Visit `/themes` | Theme showcase renders | P2 |

---

## 17. SEO & Metadata Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SEO-01 | Title tag | Each page | Unique, descriptive `<title>` ({Page} | Ammar Times) | P1 |
| SEO-02 | Meta description | Each page | Unique description < 160 chars | P1 |
| SEO-03 | Canonical URL | Each page | `<link rel="canonical">` present | P1 |
| SEO-04 | OpenGraph tags | Each page | `og:title`, `og:description`, `og:url`, `og:image` | P1 |
| SEO-05 | Twitter card | Pages | `twitter:card`, `twitter:title` set | P2 |
| SEO-06 | OG image | `GET /opengraph-image` | Dynamic OG image generated | P2 |
| SEO-07 | Sitemap | `GET /sitemap.xml` | Valid XML with all public routes | P1 |
| SEO-08 | Robots.txt | `GET /robots.txt` | Valid robots.txt, allows crawling in production | P1 |
| SEO-09 | JSON-LD schema | Home page | WebSite + CollectionPage structured data | P2 |
| SEO-10 | Breadcrumbs JSON-LD | Game pages | BreadcrumbList structured data | P2 |
| SEO-11 | No-index staging | Non-production deploy | `robots: noindex, nofollow` | P2 |
| SEO-12 | Canonical redirect | Hit non-canonical hostname | 308 redirect to canonical (middleware) | P2 |

---

## 18. Security Tests

### 18.1 Input Validation

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SEC-01 | XSS in display name | Enter `<script>alert(1)</script>` as name | Sanitized, script not executed | P0 |
| SEC-02 | XSS in group name | Create group with HTML in name | HTML escaped in output | P0 |
| SEC-03 | SQL injection | Send `'; DROP TABLE users;--` in API | Parameterized query, no injection | P0 |
| SEC-04 | Zod validation | Send malformed JSON to any POST API | 400 error with validation message | P0 |
| SEC-05 | Input sanitizer | `inputSanitizer.js` functions | Strips dangerous characters, preserves Unicode | P1 |

### 18.2 Rate Limiting

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SEC-06 | Register rate limit | 6 registers in 60s | 6th returns 429 (limit: 5/min) | P0 |
| SEC-07 | Login rate limit | 11 login attempts in 60s | 11th returns 429 (limit: 10/min) | P0 |
| SEC-08 | Account delete rate | 2 delete requests in 1 hour | 2nd returns 429 (limit: 1/hour) | P1 |
| SEC-09 | Rate limit headers | Any 429 response | `Retry-After` header present | P2 |
| SEC-10 | Rate limit fallback | DB unavailable | Falls back to in-memory rate limiting | P2 |

### 18.3 Auth Security

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SEC-11 | Admin auth guard | Access admin API without credentials | 401 returned | P0 |
| SEC-12 | CSRF protection | Forge cross-site POST | NextAuth CSRF token required | P1 |
| SEC-13 | Secure cookies | Check Set-Cookie headers | httpOnly, Secure, SameSite flags | P1 |
| SEC-14 | Password hashing | Check stored password | bcrypt hash, not plaintext | P0 |
| SEC-15 | Session expiry | Wait for session timeout | Session expires, requires re-login | P2 |

### 18.4 Data Security

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| SEC-16 | Env vars not exposed | Check client-side JS | No DATABASE_URL, NEXTAUTH_SECRET in bundle | P0 |
| SEC-17 | API key protection | Check network tab for Wordnik calls | Key only used server-side, not in client | P0 |
| SEC-18 | Secure storage | Check localStorage writes | Uses `secureStorage` wrapper, not raw | P1 |

---

## 19. Performance Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| PRF-01 | Lighthouse score | Run Lighthouse on homepage | Performance ≥ 80 | P1 |
| PRF-02 | First Contentful Paint | Lighthouse | < 2.0s | P1 |
| PRF-03 | Largest Contentful Paint | Lighthouse | < 2.5s | P1 |
| PRF-04 | Cumulative Layout Shift | Lighthouse | < 0.1 | P1 |
| PRF-05 | Total Blocking Time | Lighthouse | < 300ms | P2 |
| PRF-06 | Bundle size | Analyze `.next` output | No single chunk > 500KB | P2 |
| PRF-07 | API response time | Time `/api/health` | < 500ms | P1 |
| PRF-08 | Leaderboard query | Time `/api/leaderboard/daily` | < 1000ms | P2 |
| PRF-09 | Static pages | Check build output | Pre-rendered pages served from CDN | P2 |
| PRF-10 | Image optimization | Check `<Image>` usage | Next.js Image component used, proper sizes | P2 |
| PRF-11 | Load test | `node scripts/load-test.js` | Server handles 50 concurrent requests | P2 |
| PRF-12 | SSE connection limits | Open 3 SSE connections per IP | 4th rejected with 429 | P2 |
| PRF-13 | SSE timeout | Hold SSE connection | Auto-closes after 2 minutes (serverless) | P2 |
| PRF-14 | Dictionary load time | First word validation | Local dictionary loads < 200ms | P2 |

---

## 20. Accessibility Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| A11Y-01 | Keyboard navigation | Tab through home page | All interactive elements reachable | P1 |
| A11Y-02 | Focus indicators | Tab to elements | Visible focus ring (`focus-visible:ring`) | P1 |
| A11Y-03 | Screen reader | Use NVDA/VoiceOver on game | Game state announced (e.g., "Correct letter A in position 1") | P2 |
| A11Y-04 | ARIA labels | Inspect buttons/inputs | All have `aria-label` or visible label | P1 |
| A11Y-05 | Color contrast | axe DevTools scan | No contrast violations | P1 |
| A11Y-06 | Semantic HTML | Inspect DOM | Proper `<h1>`, `<main>`, `<nav>`, `<button>` usage | P2 |
| A11Y-07 | ARIA live regions | Game events (error, win) | Announced via `aria-live="polite"` regions | P2 |
| A11Y-08 | Skip to content | Press Tab on page load | "Skip to content" link available | P3 |
| A11Y-09 | Alt text | All images | `alt` attribute present on all `<img>` | P2 |
| A11Y-10 | Modal trap | Open any modal | Focus trapped inside, Escape closes | P1 |
| A11Y-11 | Reduced motion | Set `prefers-reduced-motion` | Animations disabled/reduced | P3 |

---

## 21. Responsive Design Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| RSP-01 | Mobile (375px) | Resize to iPhone SE width | All content visible, no horizontal scroll | P0 |
| RSP-02 | Mobile (390px) | Resize to iPhone 14 width | Proper layout, touch targets ≥ 44px | P0 |
| RSP-03 | Tablet (768px) | Resize to iPad width | Layout adapts (2-column where appropriate) | P1 |
| RSP-04 | Desktop (1280px) | Full desktop | Centered content, max-width containers | P0 |
| RSP-05 | Large desktop (1920px) | Ultrawide | Content doesn't stretch too wide | P2 |
| RSP-06 | Game grids mobile | Play each game on mobile viewport | Grids fit without overflow | P0 |
| RSP-07 | Keyboard mobile | Wordle on mobile | On-screen keyboard usable, no overlap | P0 |
| RSP-08 | Header mobile | Mobile viewport | Hamburger/collapse menu if applicable | P1 |
| RSP-09 | Modals mobile | Open modal on mobile | Full-screen or properly sized, scrollable | P1 |
| RSP-10 | Landscape mode | Rotate device | Layout adapts cleanly | P2 |
| RSP-11 | Touch interactions | Tap game elements | Touch targets work (no hover-only interactions) | P0 |
| RSP-12 | Install button mobile | Mobile viewport | Download icon only (text hidden via `hidden sm:inline`) | P1 |

---

## 22. Data Persistence Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| DAT-01 | Game stats persist | Win game, reload | Stats still there | P0 |
| DAT-02 | Streaks persist | Build streak, reload | Streak maintained | P0 |
| DAT-03 | Achievements persist | Unlock badge, reload | Badge still unlocked | P0 |
| DAT-04 | Theme preference | Set theme, reload | Preference maintained | P1 |
| DAT-05 | Tutorial state | Complete tutorial, reload | Marked as seen | P1 |
| DAT-06 | Onboarding state | Complete onboarding, reload | Never shows again | P0 |
| DAT-07 | Clear storage | Clear localStorage, reload | Fresh start (onboarding triggers) | P0 |
| DAT-08 | Multiple tabs | Open two tabs, play in one | Other tab reflects changes on focus | P2 |
| DAT-09 | DB sync (auth'd) | Play logged in, check DB | Results stored in Neon Postgres | P0 |
| DAT-10 | Guest data | Play without login | Data in localStorage only | P1 |
| DAT-11 | Guest → auth merge | Login after guest play | Guest data synced to DB account | P1 |
| DAT-12 | Versioned keys | Check localStorage keys | Proper prefixes (`ammar:onboarding:v1:*`, `ammar-times-tutorials-v1`) | P2 |
| DAT-13 | Crossword progress | Save partial crossword via API | Progress restored on next visit | P1 |

---

## 23. Error Handling Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| ERR-01 | Route error boundary | Force error in game component | `error.tsx` renders with retry button | P0 |
| ERR-02 | Global error | Force app-level crash | `global-error.tsx` renders | P1 |
| ERR-03 | 404 page | Visit non-existent route | Custom `not-found.tsx` renders | P0 |
| ERR-04 | API error responses | Send invalid requests | Proper HTTP status codes + JSON error body | P0 |
| ERR-05 | Network offline | Disconnect network → play game | Graceful degradation, cached data used | P1 |
| ERR-06 | DB connection lost | Kill DB while app running | Health returns 503, app still serves cached/static pages | P1 |
| ERR-07 | External API failure | Wordnik API down | Falls back to Datamuse, then accepts word | P1 |
| ERR-08 | Rate limit message | Hit rate limit | Clear error message with retry timing | P2 |
| ERR-09 | Auth error | Session expires mid-game | Graceful redirect to login | P2 |
| ERR-10 | Puzzle data missing | Remove today's puzzle data | Fallback puzzle or clear error message | P2 |

---

## 24. Cross-Browser Tests

| ID | Test | Steps | Expected | Priority |
|----|------|-------|----------|----------|
| BRW-01 | Chrome (latest) | Full test pass | All features work | P0 |
| BRW-02 | Firefox (latest) | Full test pass | All features work | P1 |
| BRW-03 | Safari (latest) | Full test pass | All features work, iOS install modal | P1 |
| BRW-04 | Edge (latest) | Full test pass | All features work | P1 |
| BRW-05 | Chrome Android | Test on Android phone | All games playable, PWA installable | P0 |
| BRW-06 | Safari iOS | Test on iPhone | All games playable, iOS install modal works | P0 |
| BRW-07 | Samsung Internet | Test on Samsung device | Basic functionality working | P2 |
| BRW-08 | Incognito mode | Open in private browsing | Works without persistent storage (graceful) | P2 |

---

## Test Execution Summary

### Total Test Cases by Area

| Area | Count |
|------|-------|
| Build & Startup | 7 |
| Games (9 games) | 98 |
| Theme Engine | 19 |
| Achievements | 22 |
| Auth & Identity | 19 |
| API Routes | 55 |
| Groups & Social | 12 |
| Leaderboard | 8 |
| Onboarding | 13 |
| PWA & Install | 16 |
| Tutorial | 10 |
| Admin Dashboard | 15 |
| Components | 30 |
| Navigation & Routing | 19 |
| SEO & Metadata | 12 |
| Security | 18 |
| Performance | 14 |
| Accessibility | 11 |
| Responsive Design | 12 |
| Data Persistence | 13 |
| Error Handling | 10 |
| Cross-Browser | 8 |
| **TOTAL** | **~370** |

### Priority Distribution

| Priority | Count | Description |
|----------|-------|-------------|
| **P0** | ~85 | Critical — Must pass before any release |
| **P1** | ~130 | High — Required for production quality |
| **P2** | ~120 | Medium — Important but not blocking |
| **P3** | ~15 | Low — Nice-to-have polish |

### Suggested Execution Order

1. **Phase 1** — Build & Startup (BLD) → ensures project runs
2. **Phase 2** — Navigation (NAV) → ensures all pages load
3. **Phase 3** — Auth & Identity (AUTH) → ensures user system works
4. **Phase 4** — Games (WRD, CON, CRW, NUM, TRV, SPL, STR, WAF, CMB) → core functionality
5. **Phase 5** — API Routes (API) → backend validation
6. **Phase 6** — Data Persistence (DAT) → data integrity
7. **Phase 7** — Onboarding (ONB) + Tutorial (TUT) + PWA → first-time experience
8. **Phase 8** — Groups (GRP) + Leaderboard (LDB) → social features
9. **Phase 9** — Admin (ADM) + Security (SEC) → admin & protection
10. **Phase 10** — Theme (THM) + Achievements (ACH) → engagement features
11. **Phase 11** — Components (CMP) + Responsive (RSP) + A11Y → UI quality
12. **Phase 12** — SEO + Performance (PRF) + Cross-Browser (BRW) → polish

---

**Document Version:** 1.0  
**Created:** February 27, 2026  
**Status:** Ready for execution
