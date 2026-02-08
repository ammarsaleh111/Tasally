/**
 * Groups — shared constants (server + client)
 *
 * Single source-of-truth for which games appear inside Groups.
 * ALL games support unlimited mode and are available in groups.
 */

// NOTE: Crossword is excluded because it only has daily mode (no unlimited)
export const GROUP_UNLIMITED_GAMES = [
  { key: "wordle", label: "Wordle", icon: "📝", color: "hsl(142 43% 54%)" },
  { key: "numbers", label: "Numbers", icon: "🔢", color: "hsl(0 72% 51%)" },
  { key: "trivia", label: "Trivia", icon: "🧠", color: "hsl(45 93% 47%)" },
  { key: "waffle", label: "Waffle", icon: "🧇", color: "hsl(38 92% 50%)" },
  { key: "combinations", label: "Combinations", icon: "🧩", color: "hsl(262 83% 58%)" },
  { key: "spelling", label: "Spelling Bee", icon: "🐝", color: "hsl(45 100% 51%)" },
  { key: "connections", label: "Connections", icon: "🔗", color: "hsl(200 80% 50%)" },
  { key: "strands", label: "Strands", icon: "🧵", color: "hsl(280 70% 55%)" },
] as const;

/** All game keys that are available in groups and globally */
export const ALL_GAME_KEYS = GROUP_UNLIMITED_GAMES.map((g) => g.key);

export type GroupGameKey = (typeof GROUP_UNLIMITED_GAMES)[number]["key"];

/** Set for O(1) validation */
export const GROUP_GAME_KEYS = new Set<string>(
  GROUP_UNLIMITED_GAMES.map((g) => g.key)
);

/** Maximum groups a single identity can own */
export const MAX_GROUPS_OWNED = 3;

/** Invite expiry duration in days */
export const INVITE_EXPIRY_DAYS = 7;

/** Maximum members per group */
export const MAX_GROUP_MEMBERS = 50;

/** Display name constraints */
export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;
export const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Compute points for a group game result.
 *
 * All games normalised to a 0-200 scale:
 *   Won  → base 100 + time bonus (up to +40) + accuracy bonus (up to +60)
 *   Lost → 0-10 consolation
 *
 * This prevents farming any single game for disproportionate points.
 */
export function computeGroupPoints(
  gameKey: string,
  won: boolean,
  moves: number | null | undefined,
  timeMs: number
): number {
  if (!won) {
    // consolation: 5 points for attempt (capped)
    return 5;
  }

  const BASE = 100;
  const MAX_TIME_BONUS = 40;
  const MAX_ACCURACY_BONUS = 60;

  // Time bonus — faster = more points, cap at 5 minutes
  // At 0s → full bonus, at 300s → 0 bonus
  const timeSec = Math.max(0, timeMs / 1000);
  const timeBonus = Math.round(
    MAX_TIME_BONUS * Math.max(0, 1 - timeSec / 300)
  );

  // Accuracy bonus — game-specific
  let accuracyBonus = 0;
  const m = Math.max(0, moves ?? 0);

  switch (gameKey) {
    case "wordle":
      // Fewer attempts → higher bonus. 1 attempt = max, 6 = 0
      accuracyBonus = Math.round(MAX_ACCURACY_BONUS * Math.max(0, (6 - m) / 5));
      break;
    case "numbers":
      // Fewer moves → higher bonus (max ~6 moves)
      accuracyBonus = Math.round(
        MAX_ACCURACY_BONUS * Math.max(0, (6 - Math.min(m, 6)) / 5)
      );
      break;
    case "trivia":
      // moves = correct answers (out of 10)
      accuracyBonus = Math.round(MAX_ACCURACY_BONUS * (m / 10));
      break;
    case "waffle":
      // Fewer swaps → higher bonus (max 15 swaps)
      accuracyBonus = Math.round(
        MAX_ACCURACY_BONUS * Math.max(0, (15 - Math.min(m, 15)) / 14)
      );
      break;
    case "combinations":
      // Fewer moves → higher bonus
      accuracyBonus = Math.round(
        MAX_ACCURACY_BONUS * Math.max(0, (10 - Math.min(m, 10)) / 9)
      );
      break;
    case "spelling":
      // moves = words found. More words → higher bonus (cap at 20)
      accuracyBonus = Math.round(
        MAX_ACCURACY_BONUS * Math.min(1, m / 20)
      );
      break;
    default:
      accuracyBonus = 0;
  }

  return Math.max(0, Math.min(200, BASE + timeBonus + accuracyBonus));
}
