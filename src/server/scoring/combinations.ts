import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreCombinations(input: ScoreInput): ScoreResult {
  if (!input.success) {
    return { score: 0, success: false, attempts: input.attempts ?? null, durationMs: input.durationMs ?? null, metadata: input.metadata ?? {} };
  }

  const metadata = input.metadata ?? {};
  const moves = Math.max(0, Number(metadata.moves ?? 0));
  const durationMs = Math.max(0, input.durationMs ?? 0);
  const base = 1200;
  const movePenalty = moves * 40;
  const timePenalty = Math.floor(durationMs / 1000 / 2);

  const score = clampScore(base - movePenalty - timePenalty);

  return {
    score,
    success: true,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...metadata, moves },
  };
}
