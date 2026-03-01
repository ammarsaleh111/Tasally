# 🎮 Tasally (تسالي)

A premium daily puzzle games platform featuring **9 engaging games**, **7 seasonal themes**, **48 achievements**, a full **backend with auth/groups/leaderboards**, and a **PWA** install experience — inspired by the New York Times Games suite.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-green)
![NextAuth](https://img.shields.io/badge/NextAuth-5_beta-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1)
![PWA](https://img.shields.io/badge/PWA-Installable-blueviolet)

---

## Table of Contents

- [Features](#-features)
- [Games (9)](#-games-9)
- [Theme Engine (7 Themes)](#-theme-engine-7-seasonal-themes)
- [Achievement System (48 Badges)](#-achievement-system-48-badges)
- [Backend & API](#-backend--api)
- [Groups & Social](#-groups--social)
- [PWA & Install Experience](#-pwa--install-experience)
- [Onboarding System](#-onboarding-system)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Deployment (Netlify)](#-deployment-netlify)
- [Scripts](#-scripts)
- [Documentation Index](#-documentation-index)
- [How to Play](#-how-to-play)
- [License & Acknowledgments](#-license--acknowledgments)

---

## ✨ Features

### Platform Highlights

| Feature                    | Description                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| **9 Puzzle Games**         | Wordle, Connections, Crossword, Numbers, Trivia, Spelling Bee, Strands, Waffle, Combinations |
| **Daily & Practice Modes** | Date-based daily puzzles + unlimited random practice                                         |
| **7 Seasonal Themes**      | Auto-activating themes with custom visuals, word lists, and trivia                           |
| **48 Achievements**        | Unlockable badges across 10 categories                                                       |
| **Groups & Social**        | Create/join groups, group leaderboards, invite players                                       |
| **Global Leaderboards**    | Daily & monthly rankings with scoring per game                                               |
| **Player Profiles**        | Persistent stats, streaks, activity graphs, badge collections                                |
| **PWA Installable**        | Works offline, installable on mobile & desktop                                               |
| **Admin Dashboard**        | Real-time metrics, user management, theme control                                            |
| **Google OAuth + Guest**   | Full auth with guest-to-account linking                                                      |
| **Dark/Light Mode**        | Smooth theme transitions                                                                     |
| **Accessibility**          | ARIA labels, keyboard navigation, semantic HTML                                              |
| **SEO Optimized**          | OpenGraph images, JSON-LD, sitemaps, robots.txt                                              |
| **Real-Time SSE**          | Live admin dashboard with Server-Sent Events                                                 |
| **Rate Limiting**          | Per-endpoint rate limiting with DB-backed tracking                                           |

### UI/UX Features

- 🎊 Confetti celebrations on wins
- 📤 One-click emoji result sharing
- 🔔 Browser notification reminders
- ⏰ Daily puzzle countdown timer
- 📊 7-day and 30-day activity graphs
- 🎯 One-away detection in Connections
- 💡 Hint systems for Spelling Bee & Strands
- 📖 Interactive tutorial system (first-time + on-demand)
- 🔒 Secure localStorage with versioned keys
- 🌙 Arabic font support (Cairo) for Ramadan theme

---

## 🎮 Games (9)

| #   | Game                  | Description                                   | Modes                           |
| --- | --------------------- | --------------------------------------------- | ------------------------------- |
| 1   | **📝 Wordle**         | Guess the hidden word in 6 tries              | Daily, Practice (4/5/6 letters) |
| 2   | **🔗 Connections**    | Group 16 words into 4 themed categories       | Daily, Practice                 |
| 3   | **🔤 Mini Crossword** | Solve the daily 5×5 crossword puzzle          | Daily                           |
| 4   | **🔢 Numbers**        | Use 6 numbers + operators to reach a target   | Daily, Practice                 |
| 5   | **🧠 Trivia**         | Answer 10 questions across categories         | Daily, Practice                 |
| 6   | **🐝 Spelling Bee**   | Form words from 7 letters (must use center)   | Daily, Practice                 |
| 7   | **🔀 Strands**        | Find themed words in a letter grid            | Daily                           |
| 8   | **🧇 Waffle**         | Swap letters in a waffle-shaped grid to solve | Daily                           |
| 9   | **🔄 Combinations**   | Find the correct combination of elements      | Daily                           |

Each game includes:

- Per-game statistics (played, win rate, streaks, best scores)
- Shareable emoji results
- Themed variants during seasonal events
- Scoring module for leaderboard integration

---

## 🎭 Theme Engine (7 Seasonal Themes)

Themes auto-activate based on date range and transform the entire platform:

| Theme              | Period          | Effects                                          |
| ------------------ | --------------- | ------------------------------------------------ |
| 🎃 **Halloween**   | Oct 25 – 31     | Dark orange palette, spooky words & trivia       |
| 🎄 **Christmas**   | Dec 20 – 26     | Red/green palette, holiday words & trivia        |
| ⚽ **Sports Week** | Feb 1 – 7       | Sports-themed content                            |
| 🌙 **Ramadan**     | Feb 17 – Mar 18 | Gold/purple palette, Arabic font, Islamic trivia |
| 🏆 **World Cup**   | Jun 1 – Jul 15  | Football-themed content                          |
| 🎵 **Music Week**  | Mar 15 – 21     | Music-themed words & trivia                      |
| 🎬 **Oscar Week**  | Mar 1 – 8       | Film-themed content                              |

Each theme provides:

- Custom CSS color tokens
- Corner decorations (SVG)
- Background patterns
- Themed word lists for Wordle
- Themed trivia questions
- Animated banner with dismiss option
- Season-aware icons throughout the UI

Theme architecture: `src/themes/` (registry, engine, tokens, types)

---

## 🏆 Achievement System (48 Badges)

Achievements span 10+ categories:

| Category         | Examples                                      |
| ---------------- | --------------------------------------------- |
| **Streak**       | 3, 7, 10, 30, 100 day streaks                 |
| **Wordle**       | First win, perfect game, speed solve          |
| **Connections**  | Perfect group, no mistakes                    |
| **Crossword**    | Speed completion, streak                      |
| **Numbers**      | Exact match, minimal steps                    |
| **Trivia**       | Perfect 10, category mastery                  |
| **Spelling Bee** | Queen Bee (all words), Genius level           |
| **Strands**      | No hints, speed find                          |
| **Waffle**       | Minimal swaps, perfect solve                  |
| **Combinations** | Streak, perfect accuracy                      |
| **General**      | 100 total games, play all games, perfect week |

Managed by: `src/utils/achievementsEngine.js` (580 lines) + `src/utils/badgesEngine.js` (599 lines)

---

## 🔌 Backend & API

### Architecture

- **Database:** Neon PostgreSQL via Drizzle ORM
- **Auth:** NextAuth v5 (Google OAuth + Credentials) with guest identity system
- **API:** ~45 route handlers across 21 endpoint groups
- **Real-Time:** Server-Sent Events (SSE) for admin dashboard
- **Rate Limiting:** DB-backed per-endpoint throttling
- **Observability:** Request timers, DB query tracking

### API Endpoint Groups

| Group                  | Routes | Purpose                                             |
| ---------------------- | ------ | --------------------------------------------------- |
| `/api/auth`            | 2      | Registration, NextAuth handlers                     |
| `/api/identity`        | 5      | Guest/user identity (claim, find, link, me, rename) |
| `/api/results`         | 1      | Submit game results                                 |
| `/api/leaderboard`     | 2      | Daily & monthly rankings                            |
| `/api/leaderboards`    | 1      | Global leaderboard                                  |
| `/api/games`           | 1      | Global game results                                 |
| `/api/groups`          | 8      | Group CRUD, invite, kick, leave, leaderboard        |
| `/api/invites`         | 2      | Invite management                                   |
| `/api/admin`           | 7      | Dashboard stats, user management, theme control     |
| `/api/presence`        | 2      | Heartbeat, online count                             |
| `/api/realtime`        | 4      | SSE stream, heartbeat, polling, telemetry           |
| `/api/crossword`       | 2      | Daily puzzle, progress saving                       |
| `/api/dictionary`      | 1      | Word lookup                                         |
| `/api/word-validation` | 1      | 3-layer validation (local → Wordnik → Datamuse)     |
| `/api/word-definition` | 1      | Word definitions                                    |
| `/api/health`          | 1      | Health check                                        |
| `/api/theme`           | 1      | Theme settings                                      |
| `/api/activity`        | 1      | Activity tracking                                   |
| `/api/account`         | 1      | Account deletion                                    |
| `/api/link-guest`      | 1      | Guest-to-account linking                            |
| `/api/players`         | 1      | Player data                                         |

### Database Schema

10 migrations (`drizzle/0000` – `drizzle/0009`) covering:

- Users, sessions, accounts (NextAuth)
- Guest profiles & identity system
- Game results & daily scores
- Groups, memberships, invites
- Rate limiting table
- Global leaderboard tables
- Crossword progress
- Scalability indexes & caching

### Word Validation Pipeline

Three-layer validation for all word games:

1. **Local Dictionary** — 90,000 words indexed in-memory for instant checks
2. **Wordnik Proxy** — `/api/word-validation` with API key, cached per session
3. **Datamuse Fallback** — Confirms words when Wordnik is unsure or rate-limited

---

## 👥 Groups & Social

- Create private groups with invite codes
- Group leaderboards with total scoring
- Play games in group context (results tracked per group)
- Invite players, kick members, leave groups
- Display name claiming & renaming per group identity
- Components: `src/components/groups/` (6 components)

---

## 📱 PWA & Install Experience

- Full Progressive Web App with `manifest.webmanifest` and Service Worker
- Installable on Android, iOS, and Desktop
- Floating install button on homepage (top-right, glassmorphism design)
- Header install button across all pages
- iOS-specific install modal with step-by-step instructions
- Detects if already installed and hides prompts
- PWA icons: 192px and 512px (regular + maskable)

---

## 🎓 Onboarding System

First-time users experience a strict-sequence flow:

1. **Name Entry** — Collect display name via `IdentityGate`
2. **Tutorial** — Interactive walkthrough of all games
3. **Install Banner** — One-time PWA install prompt

Features:

- Versioned localStorage keys (`tasally:onboarding:v1:*`)
- Deep-link protection (completes onboarding before returning to intended route)
- Hydration-safe (SSR-compatible)
- Components: `src/components/onboarding/` + `src/components/OnboardingFlow.jsx`

---

## 🛠️ Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| **Framework**  | Next.js 16.1.1 (App Router, Turbopack)       |
| **UI**         | React 19.2, Tailwind CSS 4, Framer Motion 12 |
| **Fonts**      | Geist Sans, Geist Mono, Cairo (Arabic)       |
| **Database**   | Neon PostgreSQL, Drizzle ORM 0.45            |
| **Auth**       | NextAuth v5 (Google OAuth + Credentials)     |
| **Validation** | Zod 3                                        |
| **Language**   | TypeScript 5.6 + JavaScript (mixed)          |
| **Deployment** | Netlify (with `netlify.toml`)                |
| **PWA**        | Custom Service Worker + Web App Manifest     |

---

## 📁 Project Structure

```
tasally/
├── README.md                  # This file
├── docs/                      # All documentation (37 .md files)
│   ├── CHANGELOG.md
│   ├── QUICKSTART.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY.md
│   ├── DESIGN_SYSTEM.md
│   ├── api-audit/             # API audit reports
│   └── ...                    # 30+ more docs
│
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── page.js            # Home page
│   │   ├── layout.js          # Root layout (providers, theme, onboarding)
│   │   ├── HomePageClient.jsx # Client-side home page
│   │   │
│   │   ├── games/             # 9 game pages
│   │   │   ├── wordle/
│   │   │   ├── connections/
│   │   │   ├── crossword/
│   │   │   ├── numbers/
│   │   │   ├── trivia/
│   │   │   ├── spelling/
│   │   │   ├── strands/
│   │   │   ├── waffle/
│   │   │   └── combinations/
│   │   │
│   │   ├── admin/             # Admin dashboard & login
│   │   ├── profile/           # Player profile & stats
│   │   ├── badges/            # Achievements collection
│   │   ├── groups/            # Groups & social play
│   │   ├── leaderboard/       # Global rankings
│   │   ├── login/             # Authentication
│   │   ├── themes/            # Theme showcase
│   │   ├── how-to-play/       # Game rules
│   │   ├── word-games/        # SEO landing page
│   │   ├── puzzle-games/      # SEO landing page
│   │   ├── daily-puzzle-archive/ # Archive page
│   │   │
│   │   └── api/               # ~45 API route handlers
│   │       ├── auth/
│   │       ├── identity/
│   │       ├── results/
│   │       ├── leaderboard/
│   │       ├── groups/
│   │       ├── admin/
│   │       ├── realtime/
│   │       ├── crossword/
│   │       ├── presence/
│   │       └── ...
│   │
│   ├── components/            # ~80 React components
│   │   ├── onboarding/        # Onboarding flow (3)
│   │   ├── tutorial/          # Tutorial system (3)
│   │   ├── groups/            # Group components (6)
│   │   ├── ui/                # Base UI primitives (10)
│   │   └── ...                # 60+ feature components
│   │
│   ├── hooks/                 # 10 custom React hooks
│   ├── utils/                 # 32 utility modules
│   ├── lib/                   # 15 server/client helpers
│   ├── games/                 # Game logic (Wordle engine, word lists)
│   ├── themes/                # Theme registry, engine, tokens (7 files)
│   ├── db/                    # Drizzle schema (3 files)
│   ├── server/                # Server utils + 10 scoring modules
│   ├── data/                  # Puzzle data (5 months × 7 games = 35 JSONs)
│   └── types/                 # TypeScript declarations
│
├── public/
│   ├── manifest.webmanifest   # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── icons/                 # PWA icons
│   └── themes/                # Theme SVG assets (corners, patterns)
│
├── drizzle/                   # 10 database migrations
├── scripts/                   # Migration, testing, PWA icon generation
├── data/server/               # Server-side JSON data
├── .github/                   # Copilot instructions
├── package.json
├── drizzle.config.ts
├── middleware.ts
├── netlify.toml
├── tsconfig.json
└── eslint.config.mjs
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** (or yarn/pnpm)
- **Neon PostgreSQL** database (for backend features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tasally

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start playing!

---

## 🔑 Environment Variables

Copy `.env.example` → `.env.local` and configure:

### Required (for database & auth)

| Variable               | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `DATABASE_URL`         | Neon Postgres pooled connection string             |
| `NEXTAUTH_SECRET`      | Random 32+ char secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`         | App URL (`http://localhost:3000` for dev)          |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                         |

### Optional

| Variable          | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `WORDNIK_API_KEY` | External word validation (falls back to local dictionary) |
| `ADMIN_USERNAME`  | Admin panel username                                      |
| `ADMIN_PASSWORD`  | Admin panel password                                      |
| `ADMIN_SECRET`    | Admin session secret                                      |

---

## 🗄️ Database Setup

### Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string to `DATABASE_URL`
3. Run migrations:

```bash
npm run db:setup       # Apply all migrations
npm run db:generate    # Generate new migrations from schema
npm run db:migrate     # Apply pending migrations
```

### Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com/) → Create project
2. APIs & Services → Credentials → Create **OAuth 2.0 Client ID**
3. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.netlify.app/api/auth/callback/google`

---

## 🚀 Deployment (Netlify)

1. Connect GitHub repository to Netlify
2. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
3. Add all environment variables in Netlify dashboard
4. Deploy!

Configuration is in `netlify.toml`.

### Production Checklist

- [ ] Fresh `NEXTAUTH_SECRET` for production
- [ ] Update Google OAuth redirect URIs
- [ ] Verify `.env.local` is gitignored
- [ ] Test login flow end-to-end
- [ ] Test leaderboard submission
- [ ] Verify PWA installs correctly

---

## 📜 Scripts

| Command                 | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run dev`           | Start development server (Turbopack) |
| `npm run build`         | Production build                     |
| `npm start`             | Start production server              |
| `npm run lint`          | Run ESLint                           |
| `npm run db:setup`      | Apply database migrations            |
| `npm run db:generate`   | Generate migrations from schema      |
| `npm run db:migrate`    | Apply pending migrations             |
| `npm run test:api`      | Run API smoke tests                  |
| `npm run security-test` | Run security tests                   |
| `npm run validate-env`  | Validate environment variables       |

---

## 📚 Documentation Index

All detailed documentation lives in the [`docs/`](docs/) folder:

### Getting Started

- [QUICKSTART.md](docs/QUICKSTART.md) — Quick setup guide
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) — Full deployment instructions

### Architecture & Design

- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — UI design system & tokens
- [COLOR_QUICK_REFERENCE.md](docs/COLOR_QUICK_REFERENCE.md) — Color palette reference
- [BACKEND_IMPLEMENTATION_SUMMARY.md](docs/BACKEND_IMPLEMENTATION_SUMMARY.md) — Backend architecture
- [BACKEND_QUICK_REF.md](docs/BACKEND_QUICK_REF.md) — Backend quick reference

### Features

- [META_GAME_SYSTEM.md](docs/META_GAME_SYSTEM.md) — Meta-game & achievement system
- [EXPANSION_SUMMARY.md](docs/EXPANSION_SUMMARY.md) — Theme engine details
- [GAME_INTEGRATION_GUIDE.md](docs/GAME_INTEGRATION_GUIDE.md) — Adding new games
- [SPELLING_BEE_GUIDE.md](docs/SPELLING_BEE_GUIDE.md) — Spelling Bee implementation
- [WIN_LOSE_UX_SYSTEM.md](docs/WIN_LOSE_UX_SYSTEM.md) — Win/lose UX flow
- [GROUPS.md](docs/GROUPS.md) — Groups system
- [ERROR_SYSTEM.md](docs/ERROR_SYSTEM.md) — Error handling
- [TUTORIAL_UI_FIXES.md](docs/TUTORIAL_UI_FIXES.md) — Tutorial system

### Security

- [SECURITY.md](docs/SECURITY.md) — Security overview
- [SECURITY_AUDIT_REPORT.md](docs/SECURITY_AUDIT_REPORT.md) — Full audit report
- [SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) — Security checklist
- [SECURITY_QUICKSTART.md](docs/SECURITY_QUICKSTART.md) — Quick security setup

### Performance & Scalability

- [PERFORMANCE_UPGRADE_REPORT.md](docs/PERFORMANCE_UPGRADE_REPORT.md) — Performance optimizations
- [SCALABILITY_UPGRADE.md](docs/SCALABILITY_UPGRADE.md) — Scalability improvements

### QA & Audits

- [UI_QA_CHECKLIST.md](docs/UI_QA_CHECKLIST.md) — UI QA checklist
- [PUZZLE_DATA_QA_REPORT.md](docs/PUZZLE_DATA_QA_REPORT.md) — Puzzle data validation
- [VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md) — Verification checklist
- [MCO_AUDIT_REPORT.md](docs/MCO_AUDIT_REPORT.md) — MCO audit
- [MCO_AUDIT_SUMMARY.md](docs/MCO_AUDIT_SUMMARY.md) — MCO audit summary
- [API_AUDIT_SUMMARY.md](docs/API_AUDIT_SUMMARY.md) — API audit summary
- [api-audit/](docs/api-audit/) — Detailed API audit (routes, tests, report)

### History & Fixes

- [CHANGELOG.md](docs/CHANGELOG.md) — Version history
- [IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) — Implementation log
- [PHASE_1_2_IMPLEMENTATION.md](docs/PHASE_1_2_IMPLEMENTATION.md) — Phase 1 & 2 details
- [PLATFORM_ENHANCEMENT_REPORT.md](docs/PLATFORM_ENHANCEMENT_REPORT.md) — Platform enhancements
- [DESIGN_MIGRATION_SUMMARY.md](docs/DESIGN_MIGRATION_SUMMARY.md) — Design migration
- [LEARNING_LOG_REDESIGN.md](docs/LEARNING_LOG_REDESIGN.md) — Learning log redesign
- [ADMIN_BUGS_FIXED.md](docs/ADMIN_BUGS_FIXED.md) — Admin bug fixes
- [NETLIFY_404_FIX.md](docs/NETLIFY_404_FIX.md) — Netlify 404 fix
- [TIMEZONE_FIX.md](docs/TIMEZONE_FIX.md) — Timezone handling fix
- [STARTUP_DIAGNOSTICS.md](docs/STARTUP_DIAGNOSTICS.md) — Startup diagnostics
- [SEO_IMPLEMENTATION_2026.md](docs/SEO_IMPLEMENTATION_2026.md) — SEO implementation

---

## 🎮 How to Play

### Wordle

Guess the hidden word in 6 tries. 🟩 = correct position, 🟨 = wrong position, ⬛ = not in word.

### Connections

Find 4 groups of 4 words that share a theme. You get 4 mistakes maximum.

### Mini Crossword

Fill in the 5×5 grid using the given clues. Click clues to navigate, use arrow keys to switch direction.

### Numbers

Use the 6 given numbers and +, −, ×, ÷ to reach the target number exactly.

### Trivia

Answer 10 questions from various categories. Score 70%+ to maintain your daily streak.

### Spelling Bee

Form words using 7 letters — every word must include the center letter. Find the pangram!

### Strands

Find themed words hidden in a letter grid. The theme word spans the entire board.

### Waffle

Swap letters in a waffle-shaped grid to complete all words. Fewer swaps = better score.

### Combinations

Find the correct combination of elements using logic and deduction.

---

## 📄 License

This project is built for educational purposes.

## 🙏 Acknowledgments

Inspired by:

- **New York Times Games** — Wordle, Connections, Mini Crossword, Spelling Bee, Strands
- **Countdown** — Numbers Game
- **Waffle Game** — Waffle puzzle format

---

**Built with ❤️ for daily puzzle enthusiasts**

**Last Updated:** February 2026 | **Status:** ✅ Production Ready
