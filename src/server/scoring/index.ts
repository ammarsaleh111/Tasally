import { scoreCombinations } from "./combinations";
import { scoreConnections } from "./connections";
import { scoreCrossword } from "./crossword";
import { scoreNumbers } from "./numbers";
import { scoreSpelling } from "./spelling";
import { scoreStrands } from "./strands";
import { scoreTrivia } from "./trivia";
import { scoreWaffle } from "./waffle";
import { scoreWordle } from "./wordle";

export type ScoreInput = {
  gameKey: string;
  mode: string;
  success: boolean;
  attempts?: number | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type ScoreResult = {
  score: number;
  success: boolean;
  attempts?: number | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
};

type Scorer = (input: ScoreInput) => ScoreResult;

const scorers: Record<string, Scorer> = {
  wordle: scoreWordle,
  connections: scoreConnections,
  crossword: scoreCrossword,
  numbers: scoreNumbers,
  trivia: scoreTrivia,
  strands: scoreStrands,
  spelling: scoreSpelling,
  waffle: scoreWaffle,
  combinations: scoreCombinations,
};

export function computeScore(input: ScoreInput): ScoreResult {
  const scorer = scorers[input.gameKey];
  if (!scorer) {
    throw new Error(`Unsupported game key: ${input.gameKey}`);
  }
  return scorer({ ...input, metadata: input.metadata ?? {} });
}

export function clampScore(value: number) {
  return Math.max(0, Math.round(value));
}
