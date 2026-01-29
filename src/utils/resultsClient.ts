/**
 * Results Submission Client
 * Submits game results to the server for scoring and leaderboard tracking
 */

import { ensureGuestId } from "./guestManager";
import { getSession } from "./sessionManager";
import { getProfile } from "./profileManager";

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

export async function submitResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  try {
    const session = getSession();
    const guestId = session?.role === "GUEST" ? ensureGuestId() : null;
    // Get player name from local profile if not provided
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
      console.warn("[submitResult] Failed:", await res.text());
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("[submitResult] Error:", error);
    return null;
  }
}
