/**
 * Date Utilities - UTC-Based for Global Consistency
 * 
 * All daily puzzles reset at midnight UTC to ensure:
 * - Every user worldwide sees the same puzzle on the same day
 * - Consistent data across timezones
 * - Fair leaderboard competition
 * 
 * IMPORTANT: Always use these utilities instead of Date constructors
 * when dealing with puzzle dates, daily resets, or date comparisons.
 */

/**
 * Get current date in UTC as YYYY-MM-DD string
 * This is the canonical "today" for all puzzle selection
 * 
 * @returns {string} Date string like "2026-02-02"
 * 
 * @example
 * const today = getTodayUTC(); // "2026-02-02"
 */
export function getTodayUTC() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get milliseconds until next midnight UTC
 * Used for countdown timers to next puzzle
 * 
 * @returns {number} Milliseconds until next UTC midnight
 * 
 * @example
 * const msUntilReset = getMillisecondsUntilNextMidnightUTC();
 * setTimeout(() => loadNewPuzzle(), msUntilReset);
 */
export function getMillisecondsUntilNextMidnightUTC() {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    )
  );
  return tomorrow - now;
}

/**
 * Get time remaining until next midnight UTC as object
 * 
 * @returns {{ hours: number, minutes: number, seconds: number, totalMs: number }}
 * 
 * @example
 * const { hours, minutes, seconds } = getTimeUntilNextMidnightUTC();
 * console.log(`Next puzzle in ${hours}:${minutes}:${seconds}`);
 */
export function getTimeUntilNextMidnightUTC() {
  const diff = getMillisecondsUntilNextMidnightUTC();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs: diff };
}

/**
 * Get day offset from a reference date (UTC)
 * Useful for rotating through a list of puzzles
 * 
 * @param {Date} referenceDate - Starting point (epoch)
 * @param {Date} [currentDate] - Date to calculate offset for (defaults to now)
 * @returns {number} Number of days since reference
 * 
 * @example
 * const EPOCH = new Date('2026-01-01');
 * const offset = getDayOffsetUTC(EPOCH);
 * const puzzle = puzzles[offset % puzzles.length];
 */
export function getDayOffsetUTC(referenceDate, currentDate = new Date()) {
  const refUtc = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  const nowUtc = Date.UTC(
    currentDate.getUTCFullYear(),
    currentDate.getUTCMonth(),
    currentDate.getUTCDate()
  );
  const diffDays = Math.floor((nowUtc - refUtc) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Parse date string (YYYY-MM-DD) as UTC
 * Prevents timezone interpretation issues
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date | null} Date object or null if invalid
 * 
 * @example
 * const date = parseDateUTC('2026-02-02');
 */
export function parseDateUTC(dateString) {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  
  const [, year, month, day] = match;
  return new Date(Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10)
  ));
}

/**
 * Check if a date string is today (UTC)
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 * 
 * @example
 * if (isTodayUTC('2026-02-02')) {
 *   console.log('This puzzle is from today!');
 * }
 */
export function isTodayUTC(dateString) {
  return dateString === getTodayUTC();
}

/**
 * Format Date object to YYYY-MM-DD in UTC
 * 
 * @param {Date} date 
 * @returns {string}
 * 
 * @example
 * const tomorrow = new Date(Date.now() + 86400000);
 * const tomorrowStr = formatDateUTC(tomorrow);
 */
export function formatDateUTC(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

// ============================================================================
// MIGRATION NOTE
// ============================================================================
// Old code used:
//   - new Date().toISOString().split('T')[0]  ✅ Already UTC (OK)
//   - new Date().getDate()                     ❌ Local timezone (BAD)
//   - new Date().getMonth()                    ❌ Local timezone (BAD)
//   - new Date().getFullYear()                 ❌ Local timezone (BAD)
//
// New code should use:
//   - getTodayUTC()                            ✅ Returns "YYYY-MM-DD" in UTC
//   - formatDateUTC(date)                      ✅ Formats any Date as UTC string
//   - getTimeUntilNextMidnightUTC()            ✅ Countdown to next puzzle
// ============================================================================
