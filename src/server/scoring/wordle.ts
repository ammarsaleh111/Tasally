import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreWordle(input: ScoreInput): ScoreResult {
  if (!input.success) {
    return { score: 0, success: false, attempts: input.attempts ?? null, durationMs: input.durationMs ?? null, metadata: input.metadata ?? {} };
  }

  const attempts = Math.max(1, Math.min(10, input.attempts ?? 6));
  const durationMs = Math.max(0, input.durationMs ?? 0);

  const base = 1200;
  const attemptPenalty = (attempts - 1) * 120;
  const timePenalty = Math.floor(durationMs / 1000 / 2); // 1 point per 2 seconds

  const score = clampScore(base - attemptPenalty - timePenalty);

  return {
    score,
    success: true,
    attempts,
    durationMs,
    metadata: input.metadata ?? {},
  };
}
