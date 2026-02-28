import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreSpelling(input: ScoreInput): ScoreResult {
  const metadata = input.metadata ?? {};
  const points = Math.max(0, Number(metadata.points ?? metadata.score ?? 0));
  const pangrams = Math.max(0, Number(metadata.pangrams ?? 0));
  const wordsFound = Math.max(0, Number(metadata.wordsFound ?? 0));
  const maxScore = Math.max(0, Number(metadata.maxScore ?? 0));

  const normalizedBase = maxScore > 0 ? (points / maxScore) * 1200 : points;
  const pangramBonus = pangrams * 100;

  const score = clampScore(normalizedBase + pangramBonus);

  return {
    score,
    success: points > 0 || input.success,
    attempts: input.attempts ?? null,
    durationMs: input.durationMs ?? null,
    metadata: { ...metadata, points, pangrams, wordsFound, maxScore },
  };
}
