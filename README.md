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
- 📊 Statistics tracking for all games
- 🎊 Confetti celebrations on wins
- 📱 Fully responsive design
- ♿ Accessibility-friendly
- 💾 Progress auto-save with localStorage
- 🎯 Daily and Practice modes
- 🏆 Streak tracking system
- 📈 Performance analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

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
│   │   ├── themes/
│   │   └── layout.js
│   ├── components/
│   │   ├── GameHeader.jsx
│   │   ├── ThemeBanner.jsx
│   │   ├── Modal.jsx
│   │   └── ...
│   ├── games/
│   │   └── wordle/
│   └── utils/
│       ├── themeEngine.js
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

All games track:

- Games played
- Win rate
- Current streak
- Max streak
- Best scores
- Category performance (Trivia)

## 🔮 Future Enhancements

- [ ] Multiplayer modes
- [ ] Social sharing with score cards
- [ ] Achievement system
- [ ] Leaderboards
- [ ] More themed events
- [ ] Custom theme builder
- [ ] Daily challenges across all games

## 📄 License

This project is built for educational purposes.

## 🙏 Acknowledgments

Inspired by:

- New York Times Games (Wordle, Connections, Mini Crossword, Spelling Bee)
- NYT Digits
- Countdown Numbers Game

---

**Built with ❤️ for daily puzzle enthusiasts**
