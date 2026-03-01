# 🚀 Quick Start Guide - Meta-Game Features

## For Players

### 1. Your Profile is Auto-Created

Play any game once, and your profile is automatically created with:

- Unique player ID
- Stats tracking
- Achievement progress
- Settings

### 2. Build Your Streaks 🔥

- Win a puzzle today → Streak +1
- Come back tomorrow → Keep it going
- Miss a day or lose → Streak resets to 0

**See your streaks:**

- Games hub (🔥 indicators)
- Profile page
- Stats modals

### 3. Unlock Achievements 🏆

Play games to unlock 31 achievements:

**Easy to get:**

- 👋 Welcome! - Complete your first puzzle
- 🔥 Getting Started - 3-day streak

**Medium difficulty:**

- 🎯 Wordle Pro - Win in 2 tries
- ✨ Connections Master - Zero mistakes
- ⚡ Crossword Speedster - Solve in under 60s

**Hard to get:**

- 💯 Century Club - 100-day streak
- 🏅 Perfect Week - Win all games for 7 days

### 4. Share Your Results 📤

After winning:

1. Click the "Share Results" button
2. Emoji summary copied to clipboard
3. Paste anywhere (Twitter, Discord, etc.)

**Example:**

```
Tasally Wordle #217
🟨🟩⬛⬛🟩
⬛🟩🟩🟩🟩
```

### 5. View Your Stats 📊

Click the stats icon (📊) in any game to see:

- Games played
- Win percentage
- Current & best streaks
- 7-day activity graph
- 30-day activity graph

### 6. Check Your Profile 👤

Visit the Profile page to see:

- **Overview**: All your stats at a glance
- **Stats**: Detailed per-game metrics
- **Achievements**: 31 badges to unlock
- **Settings**: Toggle daily reminders

### 7. Enable Daily Reminders 🔔

1. Go to Profile → Settings
2. Toggle "Daily Reminders" ON
3. Grant browser notification permission
4. Get notified at 9 AM daily

---

## For Developers

### Adding Stats Tracking to a New Game

```javascript
import {
  recordGameResult,
  getGameStats,
  getTodayString,
} from "@/utils/profileManager";

// 1. Load stats on mount
useEffect(() => {
  const gameStats = getGameStats("gamename");
  setStats(gameStats);
}, []);

// 2. Record result when game ends
const result = {
  date: getTodayString(),
  win: true,
  attempts: 4,
  time: 120, // optional
  puzzleId: "gamename-2026-01-10",
  perfect: false, // optional
  // ... any game-specific data
};

const achievements = recordGameResult("gamename", result);

// 3. Update local stats display
const updatedStats = getGameStats("gamename");
setStats(updatedStats);

// 4. Show achievement notifications
if (achievements && achievements.length > 0) {
  setNewAchievements(achievements);
}
```

### Adding UI Components

```javascript
import StatisticsModal from '@/components/StatisticsModal';
import ShareResults from '@/components/ShareResults';
import AchievementNotification from '@/components/AchievementNotification';
import DailyReminder from '@/components/DailyReminder';

// In your game component:
<StatisticsModal
  isOpen={showStats}
  onClose={() => setShowStats(false)}
  gameName="gamename"
  stats={stats}
/>

<ShareResults
  gameName="gamename"
  result={resultData}
  puzzleNumber="#123"
/>

<DailyReminder gameName="gamename" />

{newAchievements.map(achievement => (
  <AchievementNotification
    key={achievement.id}
    achievementId={achievement.id}
    onClose={handleClose}
  />
))}
```

### Creating New Achievements

```javascript
// In src/utils/achievementsEngine.js

{
  id: 'my_achievement',
  name: 'Achievement Name',
  description: 'How to unlock this badge',
  icon: '🎯',
  category: 'gamename', // or 'general', 'streak'
  check: (profile, gameName, result, gameStats) => {
    // Return true when unlocked
    return gameStats.gamesWon >= 10;
  }
}
```

### Accessing Profile Data

```javascript
import { getProfile, getAllStats } from "@/utils/profileManager";

// Get full profile
const profile = getProfile();

// Get all game stats
const stats = getAllStats();
// Returns: { wordle: {...}, connections: {...}, ... }

// Get specific game stats
const wordleStats = getGameStats("wordle");

// Get achievements
const achievements = getUnlockedAchievements();
```

### Managing Settings

```javascript
import { updateSettings } from "@/utils/profileManager";

// Update user settings
updateSettings({
  remindersEnabled: true,
  // ... other settings
});
```

---

## Navigation

### Access Points

**Profile Page:**

- Site header → "👤 Profile"
- Games hub → "View Your Profile & Achievements"
- URL: `/profile`

**Stats Modal:**

- Any game → Stats icon (📊)
- Keyboard: Check game-specific shortcuts

**Achievements:**

- Profile page → Achievements tab
- Auto-popup when unlocked

---

## Tips & Tricks

### For Maximum Engagement:

1. **Play daily** → Build your streaks
2. **Try all games** → Unlock "Well Rounded" achievement
3. **Go for perfects** → Zero-mistake Connections, fast Crossword times
4. **Share your wins** → Show off to friends
5. **Check achievements** → See what's next to unlock
6. **Enable reminders** → Never miss a day

### For Best Performance:

1. **Don't clear localStorage** → You'll lose your profile
2. **Same browser** → Stats are per-browser (for now)
3. **Consistent timezone** → Ensures accurate streak tracking
4. **Complete games** → Partial plays don't count

---

## Troubleshooting

**Q: My streak reset to 0!**
A: Streaks reset if you miss a day or lose a game. Win today to start a new streak.

**Q: Achievement didn't unlock**
A: Make sure you completed the requirement in a single session. Some achievements have multiple criteria.

**Q: Can't enable notifications**
A: Check your browser settings → Notifications → Allow for this site

**Q: Stats not showing**
A: Clear your browser cache and reload. Your localStorage data should persist.

**Q: Share button not working**
A: Grant clipboard permissions in your browser or use the mobile share API.

---

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
⚠️ IE 11 (not supported)

---

## Need Help?

- Check [META_GAME_SYSTEM.md](META_GAME_SYSTEM.md) for technical details
- Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for feature overview
- Submit issues on GitHub

---

**Happy gaming! 🎮**
