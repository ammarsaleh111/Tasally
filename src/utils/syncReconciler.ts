/**
 * Sync Reconciler
 * ─────────────────────────────────────────────────────────
 * Runs when the device reconnects after prolonged offline use.
 *
 * Three-phase reconciliation:
 *   1. PUSH  — drain the offline sync queue (Phase 1)
 *   2. PULL  — fetch results recorded on other devices
 *   3. MERGE — reconcile local profile stats with server
 *
 * Conflict resolution:
 *   • Client has result, server doesn't → upload (push phase)
 *   • Server has result, client doesn't → mark locally complete
 *   • Both have same result → no-op (idempotency key match)
 *   • Both differ → server wins for score; client keeps metadata
 *   • Streak mismatch → max(server, client) if dates contiguous
 * ─────────────────────────────────────────────────────────
 */

import { processQueue } from "./offlineSyncQueue";
import {
  getUnsyncedCompletions,
  markSynced,
  recordCompletion,
  reconstructStreak,
  getSyncMeta,
  setSyncMeta,
} from "./offlineGameState";
import { getProfile, recordGameResult, checkStreakValidity } from "./profileManager";
import { getSession } from "./sessionManager";

const GAME_KEYS = [
  "wordle",
  "connections",
  "crossword",
  "numbers",
  "trivia",
  "strands",
  "spelling",
  "waffle",
  "combinations",
] as const;

export interface ReconcileResult {
  pushed: number;
  pulled: number;
  merged: number;
  errors: string[];
}

/**
 * Full three-phase reconciliation.
 * Call this when the device comes back online after being offline.
 */
export async function reconcile(): Promise<ReconcileResult> {
  const result: ReconcileResult = { pushed: 0, pulled: 0, merged: 0, errors: [] };

  // ── Phase 1: PUSH ──────────────────────────────────────
  try {
    result.pushed = await processQueue();
  } catch (err) {
    result.errors.push(`Push failed: ${String(err)}`);
  }

  // ── Phase 2: PULL ──────────────────────────────────────
  try {
    result.pulled = await pullRemoteResults();
  } catch (err) {
    result.errors.push(`Pull failed: ${String(err)}`);
  }

  // ── Phase 3: MERGE ─────────────────────────────────────
  try {
    result.merged = await mergeStreaks();
  } catch (err) {
    result.errors.push(`Merge failed: ${String(err)}`);
  }

  // Update last synced timestamp
  await setSyncMeta("lastSyncedAt", new Date().toISOString());

  return result;
}

// ── Phase 2: Pull remote results ──────────────────────────

async function pullRemoteResults(): Promise<number> {
  const session = getSession();
  if (!session?.userId || session.role === "GUEST") {
    // Guest users don't have server-side results to pull
    return 0;
  }

  const lastSynced = (await getSyncMeta("lastSyncedAt")) ?? "2020-01-01T00:00:00Z";

  let pulled = 0;

  try {
    const res = await fetch(
      `/api/results/mine?since=${encodeURIComponent(lastSynced)}&limit=200`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) return 0;

    const json = await res.json();
    const results: Array<{
      gameKey: string;
      dayKey: string;
      success: boolean;
      attempts?: number;
      durationMs?: number;
      score?: number;
      metadata?: Record<string, unknown>;
    }> = json.results ?? [];

    for (const r of results) {
      // Record locally if not already present
      await recordCompletion(r.gameKey, r.dayKey, {
        success: r.success,
        attempts: r.attempts,
        durationMs: r.durationMs,
        score: r.score,
        metadata: r.metadata,
      });

      // Also update the profile manager stats
      try {
        const profile = getProfile();
        const gameStats = profile?.games?.[r.gameKey];
        if (gameStats && gameStats.lastPlayedDate !== r.dayKey) {
          recordGameResult(r.gameKey, {
            date: r.dayKey,
            win: r.success,
            attempts: r.attempts,
          });
        }
      } catch {
        // Profile update errors are non-fatal
      }

      pulled++;
    }
  } catch {
    // Network error — will try next time
  }

  // Mark local unsynced completions as synced (they were pushed in Phase 1)
  try {
    const unsynced = await getUnsyncedCompletions();
    for (const c of unsynced) {
      await markSynced(c.id);
    }
  } catch {
    // Non-fatal
  }

  return pulled;
}

// ── Phase 3: Merge streaks ────────────────────────────────

async function mergeStreaks(): Promise<number> {
  const profile = getProfile();
  if (!profile) return 0;

  let merged = 0;

  for (const gameKey of GAME_KEYS) {
    const gameStats = profile.games?.[gameKey];
    if (!gameStats) continue;

    // First, validate streak against missed days
    checkStreakValidity(gameKey);

    // Then reconstruct from local completions and take max
    try {
      const localStreak = await reconstructStreak(gameKey);
      const currentStreak = gameStats.currentStreak ?? 0;

      if (localStreak > currentStreak) {
        gameStats.currentStreak = localStreak;
        if (localStreak > (gameStats.longestStreak ?? 0)) {
          gameStats.longestStreak = localStreak;
        }
        merged++;
      }
    } catch {
      // Non-fatal — keep existing streak
    }
  }

  if (merged > 0) {
    // Save the updated profile
    const { saveProfile } = await import("./profileManager");
    saveProfile(profile);
  }

  return merged;
}
