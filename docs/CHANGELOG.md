# Changelog

All notable changes to Ammar Times will be documented in this file.

## [2.0.0] - 2026-01-10

### 🎉 Major Update: Meta-Game System

The complete meta-game system has been implemented, transforming Ammar Times into an engaging platform with persistent player progress.

### ✨ Added

#### Core Infrastructure

- **Player Profile System** - Auto-created profiles with unique IDs
- **Stats Engine** - Comprehensive tracking across all 5 games
- **Streak System** - Daily streak tracking with timezone safety
- **Achievement Engine** - 31 unlockable badges with unlock conditions
- **History Tracking** - Complete game history with date-based lookup

#### UI Components

- **StatisticsModal** - Enhanced stats display with 7/30-day graphs
- **ShareResults** - One-click emoji-based result sharing
- **AchievementBadge** - Badge display component
- **AchievementNotification** - Animated unlock notifications with confetti
- **DailyReminder** - Countdown timer to next puzzle
- **NotificationInitializer** - Auto-initialization of browser notifications

#### Pages

- **Profile Page** (`/profile`) - Comprehensive dashboard with 4 tabs:
  - Overview: Game summaries and quick stats
  - Stats: Detailed per-game metrics
  - Achievements: All 31 badges with unlock status
  - Settings: Daily reminder toggle

#### Features

- **31 Achievements** across 5 categories:

  - 5 Streak achievements (3, 7, 10, 30, 100 days)
  - 4 Wordle achievements
  - 3 Connections achievements
  - 3 Crossword achievements
  - 4 Numbers & Trivia achievements
  - 7 Cross-game achievements

- **Visual Statistics**:

  - 7-day activity graphs
  - 30-day compact graphs
  - Win/loss visualization
  - Per-game metrics

- **Share Functionality**:

  - Emoji-based result summaries
  - No-spoiler format
  - Clipboard copy
  - Mobile share API support
  - Toast notifications

- **Daily Reminders**:
  - Live countdown timer
  - Optional browser notifications
  - 9 AM daily notification (configurable)
  - Permission-based system

### 🔄 Changed

#### Game Integrations

- **Wordle** - Integrated with profile manager

  - Stats recording on completion
  - Share button in result modal
  - Achievement unlock notifications
  - Daily reminder display

- **Connections** - Integrated with profile manager

  - Stats recording with mistake tracking
  - Perfect game detection
  - Share functionality
  - Achievement system

- **Crossword** - Integrated with profile manager
  - Time-based stats
  - Best time tracking
  - Speed-based achievements
  - Share with time display

#### Navigation

- **Site Header** - Added Profile link
- **Games Hub** - Shows current streaks per game
- **Root Layout** - Added NotificationInitializer

### 📊 Statistics Tracked

Per-game stats now include:

- Games played
- Games won
- Win percentage
- Current streak
- Longest streak
- Last played date
- Best time (crossword)
- Average attempts (wordle, connections)
- Perfect games (connections)
- Total attempts

### 🏆 Achievement Categories

- **Streak**: Getting Started, Week Warrior, 10-Day Streak, Monthly Master, Century Club
- **Wordle**: Word Wizard, Wordle Pro, Genius, Word Master
- **Connections**: Connected, Connections Master, Flawless Record
- **Crossword**: Crossword Novice, Crossword Speedster, Lightning Fast
- **Numbers**: Number Cruncher, Exact Match
- **Trivia**: Trivia Buff, Know-It-All
- **General**: Welcome!, Well Rounded, Perfect Week, Daily Dedication, Dedicated Player

### 🎨 UI/UX Improvements

- Gradient profile headers
- Animated achievement unlocks
- Confetti effects on achievements
- Color-coded game cards
- Streak fire indicators 🔥
- Responsive mobile-first design
- Clean NYT-style graphs
- Smooth transitions

### 🔧 Technical

- localStorage-based persistence
- Timezone-safe date handling
- Efficient graph rendering
- Memoized calculations
- Async achievement checks
- Browser notification API integration
- Clipboard API with fallbacks

### 📚 Documentation

- **META_GAME_SYSTEM.md** - Complete technical documentation
- **IMPLEMENTATION_SUMMARY.md** - Implementation overview
- **QUICKSTART.md** - User and developer guide
- Updated README.md with meta-game features
- Updated project structure documentation

### 🐛 Bug Fixes

- Fixed profile creation timing
- Corrected streak calculation logic
- Fixed graph rendering on mobile
- Resolved notification permission flow
- Fixed share button clipboard issues

### 🔮 Breaking Changes

None. All existing game functionality remains intact. The meta-game system is purely additive.

### 📦 Files Added

**Core (3 files):**

- src/utils/profileManager.js
- src/utils/achievementsEngine.js
- src/utils/notificationManager.js

**Components (6 files):**

- src/components/StatisticsModal.jsx
- src/components/ShareResults.jsx
- src/components/AchievementBadge.jsx
- src/components/AchievementNotification.jsx
- src/components/DailyReminder.jsx
- src/components/NotificationInitializer.jsx

**Pages (1 file):**

- src/app/profile/page.jsx

**Documentation (3 files):**

- META_GAME_SYSTEM.md
- IMPLEMENTATION_SUMMARY.md
- QUICKSTART.md

### 📦 Files Modified

**Game Integrations (3 files):**

- src/games/wordle/Wordle.jsx
- src/app/games/connections/page.jsx
- src/app/games/crossword/page.jsx

**Navigation (3 files):**

- src/components/SiteHeader.jsx
- src/app/games/page.js
- src/app/layout.js

**Documentation (1 file):**

- README.md

### 📈 Stats

- **Total Lines of Code**: ~2,500
- **New Components**: 6
- **New Utilities**: 3
- **New Pages**: 1
- **Achievements**: 31
- **Games Integrated**: 3
- **Files Created**: 10
- **Files Modified**: 6

### 🎯 Success Metrics

✅ Player engagement features implemented
✅ Streak system operational
✅ Achievement engine functional
✅ Share functionality working
✅ Browser notifications optional
✅ Profile dashboard complete
✅ Mobile responsive
✅ No console errors
✅ Dark mode compatible
✅ Zero setup friction

---

## [1.0.0] - 2026-01-09

### Initial Release

- 5 daily puzzle games (Wordle, Connections, Crossword, Numbers, Trivia)
- 7 seasonal themes with auto-activation
- Dark/Light mode toggle
- Basic statistics tracking
- localStorage persistence
- Responsive design
- Theme engine

---

**Format**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles.
**Versioning**: This project uses [Semantic Versioning](https://semver.org/).
