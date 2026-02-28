import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreTrivia(input: ScoreInput): ScoreResult {
  const metadata = input.metadata ?? {};
  const correct = Math.max(0, Number(metadata.correct ?? 0));
  const total = Math.max(correct, Number(metadata.total ?? 10));
  const durationMs = Math.max(0, input.durationMs ?? 0);

  const accuracy = total > 0 ? correct / total : 0;
  const base = 1200 * accuracy;
  const timePenalty = Math.floor(durationMs / 1000 / 3);
  const thresholdBonus = Math.round(Math.max(0, correct - 5) * 20);

  const score = clampScore(base + thresholdBonus - timePenalty);

  return {
    score,
    success: correct === total || input.success,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...metadata, correct, total },
  };
}
