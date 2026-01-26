# 🎮 Ammar Times

A comprehensive daily games platform featuring 5 engaging puzzle games with seasonal themes and events.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![React](https://img.shields.io/badge/React-19-blue)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## 🎯 Features

### Games

- **📝 Wordle** - Guess the 5-letter word in 6 tries (Daily & Unlimited modes, 4/5/6 letter words)
- **🔗 Connections** - Group 16 words into 4 categories with shared connections
- **🔤 Mini Crossword** - Solve the daily 5×5 crossword puzzle
- **🔢 Numbers** - Use 6 numbers to reach a target using +, −, ×, ÷ (inspired by NYT Digits)
- **🧠 Trivia** - Answer 10 daily questions across various categories with streak tracking

### 🎭 Theme Engine

7 seasonal themes that automatically transform the games:

- 🎃 Halloween (Oct 25-31)
- 🎄 Christmas (Dec 20-26)
- ⚽ Sports Week (Feb 1-7)
- 🌙 Ramadan (Feb 17 - Mar 18)
- 🏆 World Cup (Jun 1 - Jul 15)
- 🎵 Music Week (Mar 15-21)
- 🎬 Oscar Week (Mar 1-8)

Each theme includes:

- Custom color schemes
- Themed word lists
- Themed trivia questions
- Special banners
- Unique game descriptions

### ✨ Platform Features

- 🌓 Dark/Light mode with smooth transitions
- 📊 Statistics tracking for all games with visual graphs
- 👤 Player profiles with persistent progress
- 🔥 Streak tracking across all games
- 🏆 31 unlockable achievements
- 📤 Shareable results with emoji summaries
- ⏰ Daily reminders and countdown timers
- 🔔 Optional browser notifications
- 🎊 Confetti celebrations on wins
- 📱 Fully responsive design
- ♿ Accessibility-friendly
- 💾 Progress auto-save with localStorage
- 🎯 Daily and Practice modes
- 📈 7-day and 30-day activity graphs

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Neon Postgres database (for cloud features)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ammar_times

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start playing!

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

**Required for database/auth features:**

| Variable               | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`         | Neon Postgres pooled connection string                                |
| `NEXTAUTH_SECRET`      | Random 32+ character secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL`         | Your app URL (`http://localhost:3000` for dev)                        |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                            |

**Optional:**

| Variable          | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `WORDNIK_API_KEY` | External word validation (falls back to local dictionary) |
| `ADMIN_USERNAME`  | Admin panel username                                      |
| `ADMIN_PASSWORD`  | Admin panel password                                      |
| `ADMIN_SECRET`    | Admin session secret                                      |

### Database Setup (Neon Postgres)

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string to `DATABASE_URL`
3. Run migrations:

```bash
# Generate migrations from schema
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.netlify.app/api/auth/callback/google` (production)
6. Copy Client ID and Secret to your `.env.local`

## 🔐 Word Validation Pipeline

All word-based games now share a fast three-layer validator:

- **Local Dictionary** – 90,000 common words (see `src/data/dictionary/common-english-words.json`) are indexed in-memory for instant checks.
- **Wordnik Proxy** – `/api/word-validation` securely calls Wordnik with your API key and caches responses.
- **Datamuse Fallback** – Automatically confirms words when Wordnik is unsure or rate-limited. Network failures accept the word to avoid blocking play.

Results are cached per session so the same word is never validated twice, and the UI never blocks while remote checks run.

## 🎮 How to Play

### Wordle

1. Guess the hidden word in 6 attempts
2. Green = correct letter in correct position
3. Yellow = correct letter in wrong position
4. Gray = letter not in word

### Connections

1. Find groups of 4 words that share something
2. Each group has a difficulty level (easy to hard)
3. You have 4 mistakes before game over
4. One-away detection helps you learn

### Mini Crossword

1. Click a clue to select it
2. Type letters to fill the grid
3. Switch between across/down with arrow keys
4. Complete the entire puzzle to win

### Numbers

1. Use the 6 given numbers to reach the target
2. Select two numbers and an operator
3. The result replaces those numbers
4. Continue until you hit the target exactly

### Trivia

1. Answer 10 questions from various categories
2. Build a streak by answering correctly
3. Score 70%+ to maintain your daily streak
4. Beat your best score and time

## 📁 Project Structure

```
ammar_times/
├── src/
│   ├── app/
│   │   ├── games/
│   │   │   ├── wordle/
│   │   │   ├── connections/
│   │   │   ├── crossword/
│   │   │   ├── numbers/
│   │   │   └── trivia/
│   │   ├── profile/          # Player profile & achievements
│   │   ├── themes/
│   │   └── layout.js
│   ├── components/
│   │   ├── GameHeader.jsx
│   │   ├── ThemeBanner.jsx
│   │   ├── StatisticsModal.jsx
│   │   ├── ShareResults.jsx
│   │   ├── AchievementBadge.jsx
│   │   ├── DailyReminder.jsx
│   │   └── ...
│   ├── games/
│   │   └── wordle/
│   └── utils/
│       ├── themeEngine.js
│       ├── profileManager.js      # Player stats & streaks
│       ├── achievementsEngine.js  # 31 achievements
│       ├── notificationManager.js # Daily reminders
│       └── wordValidation.js
├── public/
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **React:** 19
- **Styling:** Tailwind CSS 3.4
- **Fonts:** Geist Sans & Geist Mono
- **State Management:** React Hooks
- **Persistence:** localStorage API
- **Deployment Ready:** Vercel

## 🎨 Design System

- Consistent color palette across all games
- Smooth animations and transitions
- Responsive grid layouts
- Accessible color contrasts
- Interactive feedback (toasts, confetti, modals)
- Theme-aware components

## 📊 Statistics & Tracking

### Per-Game Stats

All games track:

- Games played
- Win rate
- Current streak
- Longest streak
- Best scores/times
- Average attempts
- Perfect games

### Meta-Game Features

- **Player Profile**: Comprehensive dashboard with all your stats
- **Achievements**: 31 unlockable badges across all games
- **Visual Graphs**: 7-day and 30-day activity tracking
- **Shareable Results**: One-click emoji-based result sharing
- **Daily Streaks**: Build and maintain streaks across games
- **Reminders**: Optional notifications for new puzzles

## 🏆 Achievement System

Unlock 31 achievements by:

- Building long streaks (3, 7, 10, 30, 100 days)
- Mastering individual games (perfect scores, fast times)
- Playing across all games (well-rounded, daily dedication)
- Achieving special milestones (100 total games, perfect week)

View all achievements in your Profile page!

## 🔮 Future Enhancements

- [x] Cloud sync for cross-device profiles
- [x] Leaderboards (daily & monthly)
- [ ] Multiplayer modes
- [ ] Social features and friend challenges
- [ ] More themed events
- [ ] Custom theme builder
- [ ] Email notifications
- [ ] Advanced analytics dashboard

## 🚀 Deployment (Netlify)

### Netlify Setup

1. Connect your GitHub repository to Netlify
2. Build settings (auto-detected for Next.js):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
3. Add environment variables in Netlify dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Netlify URL, e.g., `https://ammar-times.netlify.app`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Production Checklist

- [ ] Rotate any exposed database passwords
- [ ] Generate fresh `NEXTAUTH_SECRET` for production
- [ ] Update Google OAuth redirect URIs for production domain
- [ ] Verify `.env.local` is in `.gitignore` (it is by default)
- [ ] Test login flow end-to-end
- [ ] Test leaderboard submission and display

## 📚 Documentation

- **[META_GAME_SYSTEM.md](META_GAME_SYSTEM.md)** - Complete meta-game documentation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[EXPANSION_SUMMARY.md](EXPANSION_SUMMARY.md)** - Theme system details

## 📄 License

This project is built for educational purposes.

## 🙏 Acknowledgments

Inspired by:

- New York Times Games (Wordle, Connections, Mini Crossword, Spelling Bee)
- NYT Digits
- Countdown Numbers Game

---

**Built with ❤️ for daily puzzle enthusiasts**
