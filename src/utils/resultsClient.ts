/**
 * Results Submission Client
 * Submits game results to the server for scoring and leaderboard tracking
 */

import { getGuestId } from "./guestManager";

export interface SubmitResultInput {
  gameKey: string;
  mode: string;
  success: boolean;
  attempts?: number;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface SubmitResultResponse {
  id: string;
  score: number;
}

export async function submitResult(input: SubmitResultInput): Promise<SubmitResultResponse | null> {
  try {
    const guestId = getGuestId();

    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        guestId: guestId ?? undefined,
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
