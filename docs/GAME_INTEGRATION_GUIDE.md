# 🎮 Game Integration Guide - Results Submission

This guide shows how to integrate backend results submission into your games.

## Overview

All games should submit results to the backend for:

- **Server-side scoring** (anti-cheat)
- **Leaderboard tracking**
- **Cloud progress sync**

## Quick Start

```javascript
import { submitResult } from "@/utils/resultsClient";

// After game completes
const response = await submitResult({
  gameKey: "wordle", // Required: game identifier
  mode: "daily", // Required: 'daily' | 'practice' | 'unlimited'
  success: true, // Required: did player win?
  attempts: 4, // Optional: number of attempts
  durationMs: 45000, // Optional: time in milliseconds
  metadata: {
    // Optional: game-specific data
    hints: 0,
    perfectRound: true,
  },
});

if (response) {
  console.log("Score:", response.score);
  console.log("Result ID:", response.id);
}
```

## Game-Specific Examples

### Wordle

```javascript
import { submitResult } from "@/utils/resultsClient";

// After game ends
const handleGameEnd = async (won, attempts, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "wordle",
    mode: isDaily ? "daily" : "unlimited",
    success: won,
    attempts: attempts,
    durationMs: durationMs,
    metadata: {
      wordLength: 5,
      hardMode: false,
    },
  });
};
```

**Scoring formula:**

- Base: 1200 points
- Penalty: -120 per attempt (after first)
- Penalty: -1 per 2 seconds
- Win-only (0 points for loss)

---

### Connections

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (won, mistakes, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "connections",
    mode: "daily",
    success: won,
    durationMs: durationMs,
    metadata: {
      mistakes: mistakes,
      categoriesFound: 4,
    },
  });
};
```

**Scoring formula:**

- Base: 1000 points
- Penalty: -120 per mistake
- Penalty: -1 per 3 seconds
- Win-only

---

### Crossword

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (solved, hintsUsed, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "crossword",
    mode: "daily",
    success: solved,
    durationMs: durationMs,
    metadata: {
      hintsUsed: hintsUsed,
      gridSize: "5x5",
    },
  });
};
```

**Scoring formula:**

- Base: 1500 points
- Penalty: -150 per hint
- Penalty: -1 per 2 seconds
- Win-only

---

### Numbers

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (target, result, moves, startTime) => {
  const durationMs = Date.now() - startTime;
  const exact = result === target;
  const offset = Math.abs(result - target);

  await submitResult({
    gameKey: "numbers",
    mode: "daily",
    success: exact,
    durationMs: durationMs,
    metadata: {
      target: target,
      result: result,
      offset: offset,
      exact: exact,
      moves: moves,
    },
  });
};
```

**Scoring formula:**

- Base: 1400 points (exact) or 800 points (close)
- Penalty: -40 per unit away from target
- Penalty: -30 per move
- Penalty: -1 per 2 seconds
- Partial credit for near-misses

---

### Trivia

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (correct, total, startTime) => {
  const durationMs = Date.now() - startTime;
  const won = correct === total;

  await submitResult({
    gameKey: "trivia",
    mode: "daily",
    success: won,
    durationMs: durationMs,
    metadata: {
      correct: correct,
      total: total,
      categories: ["history", "science", "sports"],
    },
  });
};
```

**Scoring formula:**

- Base: 1200 × (correct/total)
- Bonus: +20 per question beyond 5 correct (streak bonus)
- Penalty: -1 per 3 seconds
- Partial credit for incomplete games

---

### Strands

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (solved, hintsUsed, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "strands",
    mode: "daily",
    success: solved,
    durationMs: durationMs,
    metadata: {
      hintsUsed: hintsUsed,
      wordsFound: 8,
    },
  });
};
```

**Scoring formula:**

- Base: 1300 points
- Penalty: -120 per hint
- Penalty: -1 per 2 seconds
- Win-only

---

### Spelling Bee

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (points, pangrams, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "spelling",
    mode: "daily",
    success: points > 0,
    durationMs: durationMs,
    metadata: {
      points: points,
      pangrams: pangrams,
      wordsFound: 42,
      rank: "Genius",
    },
  });
};
```

**Scoring formula:**

- Base: raw points from game
- Bonus: +150 per pangram
- Penalty: -1 per 4 seconds
- Always gives points (no win-only)

---

### Waffle

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (solved, swaps, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "waffle",
    mode: "daily",
    success: solved,
    durationMs: durationMs,
    metadata: {
      swaps: swaps,
      maxSwaps: 15,
    },
  });
};
```

**Scoring formula:**

- Base: 1400 points
- Penalty: -80 per swap
- Penalty: -1 per 2 seconds
- Win-only

---

### Combinations

```javascript
import { submitResult } from "@/utils/resultsClient";

const handleGameEnd = async (solved, moves, startTime) => {
  const durationMs = Date.now() - startTime;

  await submitResult({
    gameKey: "combinations",
    mode: "daily",
    success: solved,
    durationMs: durationMs,
    metadata: {
      moves: moves,
      optimal: 8,
    },
  });
};
```

**Scoring formula:**

- Base: 1200 points
- Penalty: -40 per move
- Penalty: -1 per 2 seconds
- Win-only

---

## Guest Support

The `submitResult` function automatically handles guests:

```javascript
// If user is logged in: attaches user_id
// If user is guest: attaches guest_id from localStorage
// The backend creates guest_profiles on first submission
```

After login, guest results are automatically linked to the user account.

---

## Error Handling

```javascript
const response = await submitResult({
  /* ... */
});

if (!response) {
  // Submission failed (network error, validation error, etc.)
  // Don't block the game - let user continue playing
  console.warn("Failed to submit result, continuing anyway");
}
```

**Important**: Never block gameplay if submission fails. The local game should still work.

---

## Testing

### Local Testing

1. Run dev server: `npm run dev`
2. Play a game to completion
3. Check browser DevTools console for submission logs
4. Verify in database:
   ```sql
   SELECT * FROM game_results ORDER BY played_at DESC LIMIT 5;
   ```

### Testing Guest → User Linking

1. Open incognito/private window
2. Click "Continue as Guest"
3. Play a game
4. Sign in with Google or email
5. Check that guest results now have your `user_id`

---

## Common Pitfalls

❌ **DON'T**:

- Submit results before game truly ends
- Send client-calculated scores (server computes them)
- Block UI waiting for submission
- Submit results for practice mode to leaderboards (backend filters)

✅ **DO**:

- Submit immediately after game ends
- Send raw outcome data (attempts, time, etc.)
- Handle submission errors gracefully
- Include all relevant metadata for scoring

---

## Leaderboard Eligibility

Results appear on leaderboards if:

- ✅ User is authenticated (not guest)
- ✅ Mode is `daily`
- ✅ Played in current UTC day/month
- ✅ Valid score > 0

---

## Debugging

Enable verbose logging:

```javascript
const response = await submitResult({
  gameKey: "wordle",
  mode: "daily",
  success: true,
  attempts: 4,
  durationMs: 45000,
});

console.log("Submission response:", response);
// { id: "uuid", score: 1050 }
```

Check API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{
    "gameKey": "wordle",
    "mode": "daily",
    "success": true,
    "attempts": 4,
    "durationMs": 45000
  }'
```

---

## Next Steps

1. Update your game's completion handler to call `submitResult`
2. Test locally with both authenticated and guest users
3. Verify results appear in database
4. Check leaderboard displays your scores
5. Deploy and test in production

**Need help?** Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full setup instructions.
