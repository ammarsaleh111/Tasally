export const GAME_KEYS = [
  "wordle",
  "crossword",
  "numbers",
  "trivia",
  "waffle",
  "combinations",
  "spelling",
  "connections",
  "strands",
] as const;

export type GameKey = (typeof GAME_KEYS)[number];

export const MONTH_KEYS = [
  "month-02",
  "month-03",
  "month-04",
  "month-05",
  "month-06",
  "2026-11",
  "2026-12",
  "2027-01",
  "2027-02",
  "2027-03",
  "2027-04",
  "2027-05",
  "2027-06",
  "2027-07",
  "2027-08",
  "2027-09",
  "2027-10",
  "2027-11",
] as const;

export type MonthKey = (typeof MONTH_KEYS)[number];

export type RawMonthDataset = Record<string, unknown>;
export type MonthGameMap = Record<GameKey, RawMonthDataset>;
