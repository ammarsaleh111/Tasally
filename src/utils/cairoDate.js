/**
 * Cairo Date Utility
 *
 * Returns today's date key (YYYY-MM-DD) in Africa/Cairo timezone.
 * Used to deterministically select "today's puzzle" across all games.
 */

/**
 * Get today's date key in Africa/Cairo timezone.
 * @returns {string} YYYY-MM-DD
 */
export function getCairoDateKey() {
  const now = new Date();
  // Intl.DateTimeFormat gives the current date in the Cairo timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale naturally outputs YYYY-MM-DD
  return formatter.format(now);
}

/**
 * Convert any Date object to a Cairo-local YYYY-MM-DD key.
 * @param {Date} date
 * @returns {string}
 */
export function dateToCairoKey(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}
