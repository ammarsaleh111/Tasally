# Learning Log Redesign - Daily, Intentional, Curated

## Overview

The Learning Log has been redesigned from a permanent word dump to a **daily workspace** where players curate their own vocabulary intentionally.

## Core Principles

### 1️⃣ Daily Reset

- Every new day starts with a fresh "Today" section
- Non-favorited words from yesterday automatically expire
- No manual cleanup required
- No accumulation of noise

### 2️⃣ Intentional Saving

- Words appear temporarily when encountered in games
- Players explicitly choose which words to save with ⭐
- Only favorited words persist permanently
- Control stays with the player

### 3️⃣ Two-Section Design

```
Learning Log
├── Today (Temporary - expires daily)
└── Saved Words ⭐ (Permanent - never expires)
```

## Data Structure

### New Storage Key

- `ammarTimes_learningLog_v2` (replaces old `ammarTimes_learningLog`)
- Migration happens automatically - old data will be ignored

### Data Model

```javascript
{
  lastCleanupDate: "2026-01-14",  // Tracks last cleanup
  today: [WordEntry],             // Temporary words
  saved: [WordEntry]              // Permanent favorites
}
```

### WordEntry Structure

```javascript
{
  word: string,              // "HELLO"
  definition: string,        // "A greeting"
  date: "YYYY-MM-DD",       // "2026-01-14"
  game: string,              // "wordle", "crossword", etc.
  isFavorite: boolean,       // true for saved words
  dateAdded: string,         // ISO timestamp
  partOfSpeech: string,      // "noun", "verb", etc.
  source: string             // "local", "api", etc.
}
```

## Behavioral Rules

### Adding Words

1. When a player encounters a word in a game:
   - Word added to **Today** section
   - Temporary - will expire at end of day
   - Visible only for current day

### Daily Reset

1. At start of each new day:
   - **Today** section cleared completely
   - **Saved** section untouched
   - Automatic - no player action needed

### Favoriting Words

1. Player clicks ⭐ on a word in Today:

   - Word moves from **Today** → **Saved Words**
   - `isFavorite` set to `true`
   - Word now permanent
   - Never auto-deleted

2. Player clicks ⭐ on a word in Saved:
   - Word moves from **Saved Words** → **Today**
   - `isFavorite` set to `false`
   - Will expire at end of day if not re-saved

### Definition Fetching

- Auto-fetches definitions for visible words (3 at a time)
- Prioritizes words without definitions
- Uses cached definitions when available
- Definitions persist with the word

## Implementation

### Key Files Modified

#### 1. learningLogEngine.js

**New Functions:**

- `performDailyCleanup()` - Checks date and clears old words
- `getTodaysWords()` - Returns temporary words
- `getSavedWords()` - Returns permanent favorites
- `getAllWords()` - Returns today + saved combined

**Modified Functions:**

- `addWordToLog()` - Adds to Today section
- `toggleFavorite()` - Moves between Today ↔ Saved
- `isFavorite()` - Checks if in Saved section
- `getLearningLogStats()` - Returns todaysWords & savedWords counts

#### 2. LearningLogModal.jsx

**Changes:**

- Removed "All Words" tab
- Two tabs: "Today" and "Saved Words"
- Visual distinction:
  - Today: Blue theme, expiration notice
  - Saved: Yellow theme, permanent badge
- Clear messaging about temporary vs permanent

#### 3. SessionInitializer.jsx

**Changes:**

- Calls `performDailyCleanup()` on app startup
- Ensures cleanup runs once per day
- Integrated with existing session tracking

## User Experience

### Today Tab

```
💡 These words will disappear at the end of the day unless you save them with ⭐

[Word Card - Blue Theme]
☆ ALGORITHM                    [Cro]
noun - A step-by-step procedure...
Jan 14 · ⏰ Expires end of day
```

### Saved Words Tab

```
⭐ These are your permanent vocabulary words. They'll never disappear!

[Word Card - Yellow Theme]
⭐ EPHEMERAL                    [Wor]
adjective - Lasting a very short time...
Jan 13
```

## Migration Strategy

### Automatic Migration

- Old data structure (`words: [], favorites: []`) ignored
- New structure initialized on first use
- No user action required
- Clean slate approach

### Data Loss

- ⚠️ Old learning log data will NOT be migrated
- This is intentional - aligns with "daily workspace" philosophy
- Players start fresh with new system

## Benefits

### For Players

1. **Reduced Noise**: No accumulation of forgotten words
2. **Intentional Learning**: Active choice = better retention
3. **Clean Interface**: Always seeing relevant words
4. **Personal Dictionary**: Saved words feel special

### For System

1. **Predictable Data Size**: Today section auto-cleans
2. **Better Performance**: Smaller daily datasets
3. **Clear Semantics**: Two sections, two purposes
4. **Easy Maintenance**: Daily cleanup = self-healing

## Testing Checklist

- [x] Words added to Today section correctly
- [x] Daily cleanup removes old Today words
- [x] Favoriting moves words to Saved
- [x] Unfavoriting moves words to Today
- [x] Saved words never auto-deleted
- [x] Cleanup runs on app startup
- [x] UI shows correct tab counts
- [x] Visual distinction clear between Today/Saved
- [x] Definitions fetch and display properly
- [x] Game badges show correctly

## API Reference

### Core Functions

```javascript
// Daily Cleanup (automatic)
performDailyCleanup() → boolean

// Get Words
getTodaysWords() → WordEntry[]
getSavedWords() → WordEntry[]
getAllWords() → WordEntry[]

// Manage Words
addWordToLog(word, game, definition?) → boolean
toggleFavorite(word) → boolean
isFavorite(word) → boolean

// Utility
getLearningLogStats() → {
  todaysWords: number,
  savedWords: number,
  totalWords: number,
  byGame: {}
}
```

## Future Enhancements

### Potential Features

1. **Weekly Review**: Show week's expired words before deletion
2. **Flashcards**: Quiz mode for saved words
3. **Export Saved**: Download saved words as CSV/JSON
4. **Word Streaks**: Track consecutive days learning
5. **Smart Suggestions**: Recommend words to save based on difficulty

### Not Planned

- ❌ Undo expired words (defeats purpose)
- ❌ Auto-save words (removes player control)
- ❌ Permanent "archive" (creates clutter)

## Philosophy

> "Less is more. A curated vocabulary list is more valuable than an exhaustive one. By making saving intentional, we ensure every saved word truly matters to the player."

The Learning Log is not a comprehensive record. It's a **daily practice** of intentional learning.

---

**Implementation Date**: January 14, 2026  
**Storage Version**: v2  
**Breaking Change**: Yes (intentional data reset)
