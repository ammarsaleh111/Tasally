import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreConnections(input: ScoreInput): ScoreResult {
  if (!input.success) {
    return { score: 0, success: false, attempts: input.attempts ?? null, durationMs: input.durationMs ?? null, metadata: input.metadata ?? {} };
  }

  const mistakes = Math.max(0, Number((input.metadata ?? {}).mistakes ?? 0));
  const durationMs = Math.max(0, input.durationMs ?? 0);
  const base = 1000;
  const mistakePenalty = mistakes * 120;
  const timePenalty = Math.floor(durationMs / 1000 / 3); // 1 point per 3 seconds

  const score = clampScore(base - mistakePenalty - timePenalty);

  return {
    score,
    success: true,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...input.metadata, mistakes },
  };
}
