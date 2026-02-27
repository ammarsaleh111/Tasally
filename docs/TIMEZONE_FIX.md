# Timezone Fix - UTC-Based Daily Puzzle Resets

## Summary

**Issue:** Daily puzzles were resetting at midnight in each user's local timezone instead of a consistent global time, causing:

- Different users seeing different puzzles at the same moment
- Data inconsistencies in leaderboards
- Unfair competition across timezones

**Solution:** All puzzle dates now use **UTC midnight** as the universal reset time.

---

## What Changed

### Core Functions (profileManager.js)

#### `getTodayString()`

**Before:**

```javascript
export function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
```

**After:**

```javascript
export function getTodayString() {
  const now = new Date();
  // Use UTC date to ensure all users worldwide see the same puzzle
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}
```

#### `getTimeUntilNextPuzzle()`

**Before:**

```javascript
export function getTimeUntilNextPuzzle() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Local midnight
  // ...
}
```

**After:**

```javascript
export function getTimeUntilNextPuzzle() {
  const now = new Date();
  // Calculate next midnight UTC
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  // ...
}
```

### Game Logic Files

All games updated to use UTC dates:

| File                                | Function            | Change                               |
| ----------------------------------- | ------------------- | ------------------------------------ |
| `wordle/wordleLogic.js`             | `getDayOffset()`    | `getFullYear()` → `getUTCFullYear()` |
| `crossword/crosswordLogic.js`       | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `crossword/crosswordLogicV2.js`     | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `connections/connectionsLogic.js`   | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `trivia/triviaLogic.js`             | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `waffle/waffleLogic.js`             | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `combinations/combinationsLogic.js` | `getTodaysPuzzle()` | Already used `.toISOString()` ✅     |
| `numbers/numbersLogic.js`           | `getDailyPuzzle()`  | `getDate()` → `getUTCDate()`         |
| `spelling/page.jsx`                 | initialization      | Already used `.toISOString()` ✅     |

---

## Impact

### For Users

- **Puzzle Reset Time:** Puzzles now reset at **midnight UTC** (not your local midnight)
- **Consistency:** Everyone worldwide sees the same puzzle on the same day
- **Countdown Timer:** Shows accurate time until next puzzle (UTC midnight)

### For Developers

- **New Utilities:** Created `src/utils/dateUtils.js` with UTC-safe helpers
- **Deprecated Pattern:** Never use `getDate()`, `getMonth()`, `getFullYear()` for puzzle logic
- **Recommended Pattern:** Use `getTodayUTC()` or `.toISOString().split('T')[0]`

---

## User Experience Examples

### Before (Broken)

```
User in New York (EST, UTC-5):
- Sees Feb 2 puzzle from 7:00 PM Feb 1 to 7:00 PM Feb 2

User in Tokyo (JST, UTC+9):
- Sees Feb 2 puzzle from 9:00 AM Feb 2 to 9:00 AM Feb 3

❌ At 8:00 PM EST on Feb 1, New York user sees Feb 2 puzzle
❌ At same moment, Tokyo user (9:00 AM Feb 2) also sees Feb 2 puzzle
❌ But London user (1:00 AM Feb 2) still sees Feb 1 puzzle!
```

### After (Fixed)

```
All users globally:
- See Feb 2 puzzle starting at midnight UTC on Feb 2
- See Feb 3 puzzle starting at midnight UTC on Feb 3

✅ At midnight UTC, EVERYONE switches to the new puzzle
✅ Leaderboards are fair - same 24-hour window for all
✅ Countdown timer shows same time for everyone
```

---

## Technical Details

### UTC vs Local Time

**UTC (Coordinated Universal Time):**

- Global standard time
- No daylight saving time
- Used by: `.toISOString()`, `.getUTCFullYear()`, `.getUTCMonth()`, `.getUTCDate()`

**Local Time:**

- User's device timezone
- Affected by DST
- Used by: `.getFullYear()`, `.getMonth()`, `.getDate()`, `.getHours()`

### Date String Format

Standard format: `YYYY-MM-DD` (ISO 8601)

```javascript
// ✅ CORRECT - UTC-based
const today = new Date().toISOString().split("T")[0]; // "2026-02-02"
const today = getTodayUTC(); // "2026-02-02"

// ❌ WRONG - Local timezone
const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
```

### Countdown Timer

```javascript
// Old (local midnight)
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0); // ❌ Local 00:00

// New (UTC midnight)
const tomorrow = new Date(
  Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0, // ✅ UTC 00:00
  ),
);
```

---

## Testing

### Verify UTC Reset

1. **Check current puzzle date:**

```javascript
import { getTodayUTC } from "@/utils/dateUtils";
console.log("Today (UTC):", getTodayUTC());
```

2. **Check countdown:**

```javascript
import { getTimeUntilNextMidnightUTC } from "@/utils/dateUtils";
const { hours, minutes, seconds } = getTimeUntilNextMidnightUTC();
console.log(`Next puzzle in ${hours}h ${minutes}m ${seconds}s`);
```

3. **Simulate timezone:**

```javascript
// Change system timezone, reload page
// Puzzle date should NOT change
// Countdown should show different hours but same UTC target
```

### Edge Cases

- **Date Line (Pacific Islands):** Users see new puzzle earlier in their day
- **Western Hemisphere:** Users see new puzzle later in their day
- **Leap Years:** `Date.UTC()` handles automatically
- **DST Changes:** No impact (UTC doesn't have DST)

---

## Migration Checklist

When adding new games or features:

- [ ] Use `getTodayUTC()` for puzzle selection
- [ ] Use `getTimeUntilNextMidnightUTC()` for countdowns
- [ ] Never use `getDate()`, `getMonth()`, `getFullYear()` for daily logic
- [ ] Test with system timezone set to different zones
- [ ] Verify leaderboard consistency across timezones

---

## Files Modified

### Core Utils

- ✅ `src/utils/profileManager.js` - `getTodayString()`, `getTimeUntilNextPuzzle()`

### Game Logic

- ✅ `src/games/wordle/wordleLogic.js` - `getDayOffset()`
- ✅ `src/app/games/numbers/numbersLogic.js` - `getDailyPuzzle()`
- ✅ `src/app/games/crossword/crosswordLogic.js` - Added comment
- ✅ `src/app/games/crossword/crosswordLogicV2.js` - Added comment
- ✅ `src/app/games/connections/connectionsLogic.js` - Added comment
- ✅ `src/app/games/trivia/triviaLogic.js` - Added comment
- ✅ `src/app/games/waffle/waffleLogic.js` - Added comment
- ✅ `src/app/games/combinations/combinationsLogic.js` - Added comment

### New Files

- ✅ `src/utils/dateUtils.js` - Comprehensive UTC utilities

---

## Future Improvements

- [ ] Add timezone display in UI ("Puzzles reset at midnight UTC")
- [ ] Show user's local reset time ("That's 7:00 PM in your timezone")
- [ ] Add admin dashboard timezone converter
- [ ] Log puzzle date changes for debugging

---

**Fixed:** February 2, 2026  
**Impact:** All users, all games  
**Breaking:** No (backward compatible - data format unchanged)
