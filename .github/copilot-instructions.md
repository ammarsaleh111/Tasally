# Ammar Times - Copilot Instructions

## Project Overview

**Ammar Times** is a comprehensive daily games platform built with Next.js 16.1, featuring 5 puzzle games with a sophisticated theme engine for seasonal events.

## Tech Stack

- **Framework:** Next.js 16.1 (App Router)
- **React:** 19
- **Styling:** Tailwind CSS 3.4
- **Fonts:** Geist Sans & Geist Mono
- **State:** React Hooks
- **Storage:** localStorage

## Project Structure

### Games (`src/app/games/`)

- **wordle/** - Word guessing game with daily/unlimited modes
- **connections/** - Group words by common themes
- **crossword/** - Daily 5×5 crossword puzzle
- **numbers/** - Math puzzle using 6 numbers to reach target
- **trivia/** - 10-question daily knowledge quiz

### Components (`src/components/`)

- GameHeader, Modal, Toast, Confetti
- ThemeBanner, ThemeProvider
- Game-specific: WordleGrid, ConnectionsGrid, CrosswordGrid, etc.

### Utils (`src/utils/`)

- **themeEngine.js** - Seasonal theme management system
- **wordValidation.js** - Word validation utilities

### Game Logic (`src/games/` and game folders)

- Pure functions for game mechanics
- Puzzle data files (daily-2026-01.js, themed.js)
- Logic files (wordleLogic.js, triviaLogic.js, etc.)

## Key Features

### Theme Engine

7 pre-configured seasonal themes that automatically activate:

- Halloween, Christmas, Sports Week, Ramadan, World Cup, Music Week, Oscar Week
- Themed word lists, trivia questions, and visual styling
- Location: `src/utils/themeEngine.js`

### Game Modes

- **Daily:** Date-based puzzles that change every day
- **Practice/Unlimited:** Random puzzles for practice

### Data Persistence

- Stats saved in localStorage
- Theme preferences
- Game progress

## Development Guidelines

### Adding New Games

1. Create folder in `src/app/games/[gamename]/`
2. Implement page.jsx with game component
3. Create [gamename]Logic.js for game mechanics
4. Add puzzles/questions in data files
5. Update games hub (`src/app/games/page.js`)

### Adding Themes

1. Add theme config to `src/utils/themeEngine.js`
2. Create themed content in appropriate files:
   - `src/games/wordle/wordLists/themed.js` for words
   - `src/app/games/trivia/questions/themed.js` for trivia
3. Specify date range and game configurations

### Styling

- Use Tailwind CSS classes
- Follow existing color palette:
  - `wordle-correct` (green)
  - `wordle-present` (yellow)
  - `wordle-absent` (gray)
  - `connections-*` for category colors
- Maintain consistent spacing and transitions

### Component Patterns

- Use `'use client'` for interactive components
- Implement proper error handling
- Add loading states
- Include accessibility attributes
- Follow React hooks best practices

## Running the Project

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
```

## Important Files

- `src/app/layout.js` - Root layout with ThemeBanner
- `src/app/games/page.js` - Games hub
- `src/app/themes/page.jsx` - Theme showcase
- `README.md` - Project documentation
- `EXPANSION_SUMMARY.md` - Detailed feature documentation

## Code Quality

- No ESLint errors
- TypeScript-style JSDoc comments
- Consistent naming conventions
- Modular, reusable components
- Performance-optimized renders

## Future Development

When adding features:

- Maintain design consistency
- Reuse existing components
- Update relevant documentation
- Test across all games
- Ensure mobile responsiveness

---

**Project Status:** ✅ Production Ready
**Last Updated:** January 2026
**Maintainer:** GitHub Copilot
