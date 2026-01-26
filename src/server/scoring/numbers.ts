import { ScoreInput, ScoreResult, clampScore } from "./index";

export function scoreNumbers(input: ScoreInput): ScoreResult {
  const metadata = input.metadata ?? {};
  const durationMs = Math.max(0, input.durationMs ?? 0);
  const moves = Math.max(0, Number(metadata.moves ?? 0));
  const offset = Math.abs(Number(metadata.offset ?? 0)); // difference from target

  const solved = Boolean(metadata.exact ?? input.success);
  const base = solved ? 1400 : 800;
  const accuracyPenalty = Math.min(600, offset * 40); // penalize distance from target
  const timePenalty = Math.floor(durationMs / 1000 / 2);
  const movePenalty = moves * 30;

  const rawScore = base - accuracyPenalty - timePenalty - movePenalty;

  return {
    score: clampScore(rawScore),
    success: solved,
    attempts: input.attempts ?? null,
    durationMs,
    metadata: { ...metadata, offset, moves, exact: solved },
  };
}
