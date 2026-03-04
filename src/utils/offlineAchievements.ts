/**
 * Offline Achievements Bridge
 * ─────────────────────────────────────────────────────────
 * Ensures achievements are evaluated against local data
 * immediately after a game completes, regardless of
 * connectivity. Also queues badge-earned events for
 * server sync when back online.
 *
 * This module is the glue between:
 *   - offlineGameState (local IndexedDB tracking)
 *   - profileManager (localStorage stats + achievements)
 *   - offlineSyncQueue (queued API writes)
 * ─────────────────────────────────────────────────────────
 */

import { recordCompletion, isCompletedLocally } from "./offlineGameState";
import { recordGameResult, getTodayString, getProfile } from "./profileManager";
import { enqueue } from "./offlineSyncQueue";

export interface OfflineGameResult {
  gameKey: string;
  date?: string;
  success: boolean;
  attempts?: number;
  durationMs?: number;
  score?: number;
  metadata?: Record<string, unknown>;
  /** The raw result object as each game constructs it (win, mistakes, time, etc.) */
  profileResult?: Record<string, unknown>;
}

/**
 * Process a game completion fully offline-aware.
 *
 * 1. Records in IndexedDB (offlineGameState)
 * 2. Updates profile stats + checks achievements (profileManager)
 * 3. Queues a badge-earned event if any new achievements unlocked
 *
 * Returns the list of newly unlocked achievements (same shape as
 * profileManager's checkAchievements).
 */
export async function processOfflineCompletion(
  input: OfflineGameResult
): Promise<any[]> {
  const date = input.date ?? getTodayString();

  // 1. Check duplicate — don't re-process same game+date
  const alreadyDone = await isCompletedLocally(input.gameKey, date);

  // 2. Record in IndexedDB for streak reconstruction & sync
  await recordCompletion(input.gameKey, date, {
    success: input.success,
    attempts: input.attempts,
    durationMs: input.durationMs,
    score: input.score,
    metadata: input.metadata,
  });

  // 3. Update profile stats + achievements (runs locally)
  //    profileManager.recordGameResult already handles:
  //    - gamesPlayed/gamesWon increment
  //    - streak update
  //    - history push
  //    - checkAchievements
  //    Skip if already processed today (idempotent for daily)
  let newAchievements: any[] = [];

  if (!alreadyDone) {
    const result = input.profileResult ?? {
      date,
      win: input.success,
      attempts: input.attempts,
      time: input.durationMs ? Math.floor(input.durationMs / 1000) : undefined,
      score: input.score,
      ...(input.metadata ?? {}),
    };

    newAchievements = recordGameResult(input.gameKey, result) ?? [];
  }

  // 4. If new achievements were unlocked, queue badge events for later sync
  if (newAchievements.length > 0) {
    const profile = getProfile();
    for (const achievement of newAchievements) {
      try {
        await enqueue("/api/activity", "POST", {
          userId: profile?.userId ?? "unknown",
          name: profile?.name ?? "Anonymous",
          event: {
            type: "BADGE_EARNED",
            badgeId: achievement.id,
            badgeName: achievement.name,
            game: input.gameKey,
            date,
          },
        });
      } catch {
        // Non-fatal — badge event might be lost but badge is saved locally
      }
    }
  }

  return newAchievements;
}
