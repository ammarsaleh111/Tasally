/**
 * Results Submission Client
 * Submits game results to the server for scoring and leaderboard tracking
 *
 * Routing:
 *   - Daily mode → /api/results (daily leaderboards)
 *   - Unlimited mode + global context → /api/games/global/results
 *   - Unlimited mode + group context → /api/groups/[groupId]/results
 */

import { ensureGuestId } from "./guestManager";
import { getSession } from "./sessionManager";
import { getProfile } from "./profileManager";
import { type GameContext, loadGameContext, submitGameResult } from "@/lib/gameContext";

export interface SubmitResultInput {
  gameKey: string;
  mode: string;
  success: boolean;
  attempts?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  displayName?: string;
}

export interface SubmitResultResponse {
  id: string;
  score: number;
}

// Helper to get player name from localStorage (client-side only)
function getPlayerNameFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const profile = getProfile();
    if (profile?.name) {
      return profile.name;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Submit result for DAILY mode games.
 * Goes to /api/results for the standard daily leaderboard.
 */
async function submitDailyResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  try {
    const session = getSession();
    const guestId = session?.role === "GUEST" ? ensureGuestId() : null;
    const displayName =
      input.displayName ?? session?.displayName ?? getPlayerNameFromStorage();

    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        guestId: guestId ?? undefined,
        displayName: displayName ?? undefined,
      }),
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch {
    return null;
  }
}

/**
 * Submit result for UNLIMITED mode games.
 * Routes to global or group endpoint based on current context.
 */
async function submitUnlimitedResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  // Get context from sessionStorage (set by group navigation or URL params)
  const context: GameContext = loadGameContext() || { type: "global" };

  try {
    const result = await submitGameResult(context, {
      gameKey: input.gameKey,
      won: input.success,
      moves: input.attempts ?? null,
      timeMs: input.durationMs ?? 0,
    });

    if (!result.ok) {
      return null;
    }

    // Handle response format from global/group endpoints
    // Global: { ok: true, data: { pointsAwarded, totals } }
    // Group: { ok: true, data: { result: { id, pointsAwarded }, totals } }
    const data = result.data;
    return {
      id: data?.result?.id || data?.id || "unknown",
      score: data?.pointsAwarded || data?.result?.pointsAwarded || data?.result?.points_awarded || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Main submit function.
 * Automatically routes to the correct endpoint based on game mode.
 */
export async function submitResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  // Daily mode always goes to the standard daily leaderboard
  if (input.mode === "daily") {
    return submitDailyResult(input);
  }

  // Unlimited mode routes based on context (global or group)
  return submitUnlimitedResult(input);
}
