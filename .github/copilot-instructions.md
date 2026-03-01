# Tasally - Copilot Instructions

## Project Overview

**Tasally (تسالي)** is a premium daily puzzle games platform built with Next.js 16.1.1, featuring **9 puzzle games**, **7 seasonal themes**, **48 achievements**, full backend with auth/groups/leaderboards, and a PWA install experience.

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router, Turbopack)
- **React:** 19.2
- **Styling:** Tailwind CSS 4
- **Fonts:** Geist Sans, Geist Mono, Cairo (Arabic)
- **Database:** Neon PostgreSQL + Drizzle ORM 0.45
- **Auth:** NextAuth v5 (Google OAuth + Credentials)
- **Validation:** Zod 3
- **Animation:** Framer Motion 12
- **Language:** TypeScript 5.6 + JavaScript (mixed)
- **State:** React Hooks + localStorage (versioned keys)
- **Deployment:** Netlify

## Project Structure

### Games (`src/app/games/`) — 9 Games

- **wordle/** — Word guessing (daily/practice, 4/5/6 letters)
- **connections/** — Group 16 words into 4 themed categories
- **crossword/** — Daily 5×5 crossword puzzle
- **numbers/** — Use 6 numbers + operators to reach a target
- **trivia/** — 10-question daily knowledge quiz
- **spelling/** — Spelling Bee (form words from 7 letters)
- **strands/** — Find themed words in a letter grid
- **waffle/** — Swap letters in a waffle grid to solve
- **combinations/** — Find correct combinations of elements

### Components (`src/components/`) — ~80 Components

- **Core:** GameHeader, Modal, Toast, Confetti, PuzzleLoader
- **Theme:** ThemeBanner, ThemeProvider, ThemeProviderNew, DominantThemeBanner, SeasonDecorations, SeasonIdentity
- **Game-specific:** WordleGrid, ConnectionsGrid, CrosswordGrid (via game pages), HoneycombGrid, StrandsGrid, WaffleGrid
- **Auth:** AuthButton, AuthModal, AuthProvider, SessionBridge, SessionInitializer
- **Social:** GroupBar, groups/ subfolder (6 components)
- **Onboarding:** OnboardingFlow, onboarding/ subfolder (NameGate, TutorialFlow, InstallBanner)
- **Tutorial:** tutorial/ subfolder (GlobalTutorial, TutorialPanel, TutorialProvider)
- **PWA:** PWARegister, InstallAppHeaderButton, InstallAppHeroButton, IOSInstallModal
- **UI primitives:** ui/ subfolder (Badge, Button, Card, Input, Progress, Skeleton, Tabs, Tooltip)
- **Stats:** Statistics, StatisticsModal, ShareResults, AchievementBadge, BadgesCollection, BadgesDrawer

### Hooks (`src/hooks/`) — 10 Custom Hooks

- useGameContext, useGroupGameResult, useGroupIdentity, useGroups
- useInstallPrompt, useLeaderboard, useOnboardingState
- usePresenceHeartbeat, usePuzzleLoader, useTutorial

### Utils (`src/utils/`) — 32 Modules

- **themeEngine.js** — Seasonal theme management (7 themes)
- **achievementsEngine.js** — 48 achievements across 10 categories
- **badgesEngine.js** — Badge tracking & notifications
- **profileManager.js** — Player stats & streaks
- **wordValidation.js** — 3-layer validation (local → Wordnik → Datamuse)
- **sessionManager.ts** — Session management
- **notificationManager.js** — Browser notifications
- **inputSanitizer.js** — Input sanitization
- **secureStorage.js** — Secure localStorage wrapper
- **storageKeys.ts** — Centralized storage key definitions
- And 22 more utilities

### Lib (`src/lib/`) — 15 Server/Client Helpers

- auth.ts, rateLimit.ts, cache.ts, seo.js, observability.ts
- adminAuth.js, heartbeatThrottle.ts, gameContext.ts
- apiErrors.ts, api/client.ts, groups/constants.ts, groups/identity.ts

### Database (`src/db/`) — Drizzle Schema

- schema.ts — Users, sessions, game results, leaderboards
- groupsSchema.ts — Groups, memberships, invites
- 10 migrations in `drizzle/`

### Server (`src/server/`)

- auth.ts, errors.ts, http.ts, dbIntrospection.ts
- scoring/ — 10 scoring modules (1 per game + index)

### Themes (`src/themes/`)

- registry.ts, engine.ts, dominantConfig.ts, types.ts
- tokens/ — baseTokens, dominantTokens, seasonDecorations

### Data (`src/data/`)

- tutorials.js — Tutorial content
- dictionary/ — 90,000 word local dictionary
- all-data/ — Puzzle data (5 months × 7 games = 35 JSON files)

### API Routes (`src/app/api/`) — ~45 Endpoints

- auth, identity, results, leaderboard, groups, admin
- realtime (SSE), presence, crossword, dictionary
- word-validation, word-definition, health, theme, activity, account

## Key Features

### Theme Engine

7 seasonal themes auto-activate by date range:

- Halloween, Christmas, Sports Week, Ramadan, World Cup, Music Week, Oscar Week
- Custom CSS tokens, corner SVGs, patterns, themed word lists & trivia
- Architecture: `src/themes/` (registry, engine, tokens)

### Onboarding System

Strict-sequence first-time flow: Name → Tutorial → Install Banner

- Versioned localStorage keys (`tasally:onboarding:v1:*`)
- Deep-link protection with session-based return routing
- Components: `src/components/onboarding/` + `OnboardingFlow.jsx`

### Groups & Social

- Create/join groups, invite players, group leaderboards
- Display name claiming per group identity
- Components: `src/components/groups/`

### PWA

- Installable on Android, iOS, Desktop
- Service Worker + Web App Manifest
- Floating install button (homepage) + header button (all pages)

### Admin Dashboard

- Real-time SSE metrics, user management, theme control
- Rate limiting, connection throttling
- Routes: `src/app/admin/` + `api/admin/`

## Development Guidelines

### Adding New Games

1. Create folder in `src/app/games/[gamename]/`
2. Add `page.jsx`, `layout.jsx`, `[gamename]Logic.js`
3. Add scoring module in `src/server/scoring/`
4. Add puzzle data in `src/data/all-data/month-XX/`
5. Update games hub (`src/app/games/page.js`)

### Adding Themes

1. Add theme config to `src/themes/registry.ts`
2. Create themed content:
   - `src/games/wordle/wordLists/themed.js` for words
   - `src/app/games/trivia/questions/themed.js` for trivia
3. Add visual assets in `public/themes/`
4. Specify date range in theme config

### Styling

- Use Tailwind CSS 4 classes
- Use CSS custom properties via `hsl(var(--...))` pattern
- Follow design tokens in `src/utils/designTokens.ts`
- Maintain consistent spacing and transitions

### Component Patterns

- Use `'use client'` for interactive components
- Implement error boundaries (`error.tsx` per route)
- Add loading states via PuzzleLoader
- Include accessibility attributes (ARIA)
- Follow React hooks rules strictly (no conditional hooks)
- Use Zod for API input validation

## Running the Project

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint
npm run db:setup     # Apply database migrations
npm run test:api     # API smoke tests
npm run validate-env # Check environment variables
```

## Important Files

- `src/app/layout.js` — Root layout (providers, theme, onboarding)
- `src/app/games/page.js` — Games hub
- `src/app/HomePageClient.jsx` — Client-side home page
- `src/components/OnboardingFlow.jsx` — Onboarding orchestrator
- `src/themes/registry.ts` — Theme definitions
- `middleware.ts` — Request middleware
- `drizzle.config.ts` — Database config
- `netlify.toml` — Deployment config
- `README.md` — Full project documentation
- `docs/` — 40 detailed documentation files

## Code Quality

- No ESLint errors
- TypeScript strict mode for .ts/.tsx files
- Zod validation on all API inputs
- Rate limiting on sensitive endpoints
- Consistent naming conventions
- Modular, reusable components
- Performance-optimized renders

## Documentation

All detailed docs are in the `docs/` folder (40 files):

- `docs/QUICKSTART.md` — Quick setup
- `docs/DEPLOYMENT_GUIDE.md` — Deployment
- `docs/SECURITY.md` — Security overview
- `docs/DESIGN_SYSTEM.md` — Design system
- `docs/CHANGELOG.md` — Version history
- `docs/api-audit/` — API audit reports
- See `README.md` for full documentation index

## Future Development

When adding features:

- Maintain design consistency
- Reuse existing components and hooks
- Add scoring module for leaderboard integration
- Update relevant documentation in `docs/`
- Test across all games
- Ensure mobile responsiveness
- Follow the onboarding/PWA patterns

---

**Project Status:** ✅ Production Ready
**Last Updated:** February 2026
**Maintainer:** GitHub Copilot
