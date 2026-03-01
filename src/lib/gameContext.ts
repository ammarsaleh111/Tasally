/**
 * Game Context Utilities
 *
 * Handles the strict separation between Global and Group game contexts.
 * Every game session must know and preserve its context.
 *
 * Context Types:
 *   - { type: "global" } — Results go to global_game_results
 *   - { type: "group", groupId: string } — Results go to group_game_results
 */

export type GameContext =
  | { type: "global" }
  | { type: "group"; groupId: string; groupName?: string };

const CONTEXT_STORAGE_KEY = "tasally_gameContext";
let globalResultsBackoffUntil = 0;
let lastGlobalSubmitKey = "";
let lastGlobalSubmitAt = 0;
const GLOBAL_SUBMIT_DEDUPE_MS = 2000;

/**
 * Parse game context from URL search params.
 * This is the primary way to determine context.
 */
export function parseGameContextFromURL(
  searchParams: URLSearchParams
): GameContext {
  const groupId = searchParams.get("groupId");
  const groupName = searchParams.get("groupName");

  if (groupId) {
    return { type: "group", groupId, groupName: groupName || undefined };
  }

  return { type: "global" };
}

/**
 * Save game context to sessionStorage.
 * Used when navigating between group pages and games.
 */
export function saveGameContext(context: GameContext): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load game context from sessionStorage.
 * Fallback when URL doesn't have context.
 */
export function loadGameContext(): GameContext | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(CONTEXT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.type === "group" && parsed.groupId) {
      return { type: "group", groupId: parsed.groupId, groupName: parsed.groupName };
    }
    if (parsed.type === "global") {
      return { type: "global" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear game context from sessionStorage.
 * Call when game ends or user navigates away.
 */
export function clearGameContext(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CONTEXT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get the appropriate return URL based on game context.
 * CRITICAL: Group games must return to group page, NOT global hub.
 */
export function getReturnURL(context: GameContext): string {
  if (context.type === "group") {
    return `/groups/${context.groupId}`;
  }
  return "/games";
}

/**
 * Build game URL with proper context params.
 */
export function buildGameURL(
  gameKey: string,
  context: GameContext,
  mode: string = "unlimited"
): string {
  const params = new URLSearchParams({ mode });

  if (context.type === "group") {
    params.set("groupId", context.groupId);
    if (context.groupName) {
      params.set("groupName", context.groupName);
    }
  }

  return `/games/${gameKey}?${params.toString()}`;
}

/**
 * Get the correct results submission URL based on context.
 * CRITICAL: Global and group results go to DIFFERENT endpoints.
 */
export function getResultsEndpoint(context: GameContext): string {
  if (context.type === "group") {
    return `/api/groups/${context.groupId}/results`;
  }
  return "/api/games/global/results";
}

/**
 * Submit game result to the correct endpoint based on context.
 */
export async function submitGameResult(
  context: GameContext,
  result: {
    gameKey: string;
    won: boolean;
    moves?: number | null;
    timeMs: number;
  }
): Promise<{ ok: boolean; data?: any; error?: string }> {
  const endpoint = getResultsEndpoint(context);
  const now = Date.now();

  if (context.type === "global") {
    if (now < globalResultsBackoffUntil) {
      return { ok: false, error: "RATE_LIMITED" };
    }

    const submissionKey = `${result.gameKey}:${result.won}:${result.moves ?? ""}:${result.timeMs}`;
    if (submissionKey === lastGlobalSubmitKey && now - lastGlobalSubmitAt < GLOBAL_SUBMIT_DEDUPE_MS) {
      return { ok: true, data: { deduped: true, pointsAwarded: 0 } };
    }

    lastGlobalSubmitKey = submissionKey;
    lastGlobalSubmitAt = now;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });

    if (res.status === 429) {
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterSeconds = Number(retryAfterHeader);
      const retryMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 60_000;
      globalResultsBackoffUntil = Date.now() + retryMs;
      return { ok: false, error: "RATE_LIMITED" };
    }

    const json = await res.json();

    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: json.error?.message || "Failed to submit result",
      };
    }

    return { ok: true, data: json.data };
  } catch (error) {
    return { ok: false, error: "Network error. Please try again." };
  }
}

/**
 * Format context for display in UI.
 */
export function formatContextBadge(context: GameContext): {
  label: string;
  color: string;
  icon: string;
} {
  if (context.type === "group") {
    return {
      label: context.groupName || "Group",
      color: "hsl(262 83% 58%)", // Purple
      icon: "👥",
    };
  }
  return {
    label: "Global",
    color: "hsl(142 43% 54%)", // Green
    icon: "🌍",
  };
}
