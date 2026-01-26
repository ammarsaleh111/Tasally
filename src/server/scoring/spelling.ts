import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreSpelling(input: ScoreInput): ScoreResult {
  const metadata = input.metadata ?? {};
  const points = Math.max(0, Number(metadata.points ?? 0));
  const pangrams = Math.max(0, Number(metadata.pangrams ?? 0));
  const durationMs = Math.max(0, input.durationMs ?? 0);

  const base = points;
  const pangramBonus = pangrams * 150;
  const timePenalty = Math.floor(durationMs / 1000 / 4);

  const score = clampScore(base + pangramBonus - timePenalty);

  return {
    score,
    success: points > 0 || input.success,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...metadata, points, pangrams },
  };
}
