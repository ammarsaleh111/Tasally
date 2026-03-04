/**
 * Results Submission Client
 * Submits game results to the server for scoring and leaderboard tracking.
 *
 * Offline-aware: if the network is down or the request fails,
 * the result is queued locally and auto-synced when connectivity
 * returns (via fetchOrQueue + offlineSyncQueue).
 *
 * Routing:
 *   - Daily mode → /api/results (daily leaderboards)
 *   - Unlimited mode + global context → /api/games/global/results
 *   - Unlimited mode + group context → /api/groups/[groupId]/results
 */

import { ensureGuestId } from "./guestManager";
import { getSession } from "./sessionManager";
import { getProfile } from "./profileManager";
import { fetchOrQueue } from "./fetchOrQueue";
import { type GameContext, loadGameContext, getResultsEndpoint } from "@/lib/gameContext";

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
  /** True when the result was queued for later sync instead of submitted live */
  queued?: boolean;
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
 * Falls back to offline queue on network failure.
 */
async function submitDailyResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  const session = getSession();
  const guestId = session?.role === "GUEST" ? ensureGuestId() : null;
  const displayName =
    input.displayName ?? session?.displayName ?? getPlayerNameFromStorage();

  const payload = {
    ...input,
    guestId: guestId ?? undefined,
    displayName: displayName ?? undefined,
  };

  const result = await fetchOrQueue<SubmitResultResponse>(
    "/api/results",
    "POST",
    payload as unknown as Record<string, unknown>
  );

  if (result.queued) {
    return { id: "queued", score: 0, queued: true };
  }

  if (!result.ok) {
    return null;
  }

  return result.data;
}

/**
 * Submit result for UNLIMITED mode games.
 * Routes to global or group endpoint based on current context.
 * Falls back to offline queue on network failure.
 */
async function submitUnlimitedResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  const context: GameContext = loadGameContext() || { type: "global" };
  const endpoint = getResultsEndpoint(context);

  const payload = {
    gameKey: input.gameKey,
    won: input.success,
    moves: input.attempts ?? null,
    timeMs: input.durationMs ?? 0,
  };

  const result = await fetchOrQueue<{ ok: boolean; data?: any }>(
    endpoint,
    "POST",
    payload
  );

  if (result.queued) {
    return { id: "queued", score: 0, queued: true };
  }

  if (!result.ok) {
    return null;
  }

  // Handle response format from global/group endpoints
  const data = result.data?.data ?? result.data;
  return {
    id: data?.result?.id || data?.id || "unknown",
    score: data?.pointsAwarded || data?.result?.pointsAwarded || data?.result?.points_awarded || 0,
  };
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
