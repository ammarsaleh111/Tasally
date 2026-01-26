import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreCrossword(input: ScoreInput): ScoreResult {
  if (!input.success) {
    return { score: 0, success: false, attempts: input.attempts ?? null, durationMs: input.durationMs ?? null, metadata: input.metadata ?? {} };
  }

  const durationMs = Math.max(0, input.durationMs ?? 0);
  const hintsUsed = Math.max(0, Number((input.metadata ?? {}).hintsUsed ?? 0));
  const base = 1500;
  const timePenalty = Math.floor(durationMs / 1000 / 2); // 1 point per 2 seconds
  const hintPenalty = hintsUsed * 150;

  const score = clampScore(base - timePenalty - hintPenalty);

  return {
    score,
    success: true,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...input.metadata, hintsUsed },
  };
}
