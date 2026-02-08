import combinationsMonth02 from "./month-02/combinations.json";
import crosswordMonth02 from "./month-02/crossword.json";
import numbersMonth02 from "./month-02/numbers.json";
import spellingMonth02 from "./month-02/spelling.json";
import triviaMonth02 from "./month-02/trivia.json";
import waffleMonth02 from "./month-02/waffle.json";
import wordleMonth02 from "./month-02/wordle.json";

import combinationsMonth03 from "./month-03/combinations.json";
import crosswordMonth03 from "./month-03/crossword.json";
import numbersMonth03 from "./month-03/numbers.json";
import spellingMonth03 from "./month-03/spelling.json";
import triviaMonth03 from "./month-03/trivia.json";
import waffleMonth03 from "./month-03/waffle.json";
import wordleMonth03 from "./month-03/wordle.json";

export const GAME_KEYS = [
  "wordle",
  "crossword",
  "numbers",
  "trivia",
  "waffle",
  "combinations",
  "spelling",
] as const;

export type GameKey = (typeof GAME_KEYS)[number];

export const MONTH_KEYS = ["month-02", "month-03"] as const;
export type MonthKey = (typeof MONTH_KEYS)[number];

export type RawMonthDataset = Record<string, unknown>;
export type MonthGameMap = Record<GameKey, RawMonthDataset>;

export const DATASETS: Record<MonthKey, MonthGameMap> = {
  "month-02": {
    wordle: wordleMonth02,
    crossword: crosswordMonth02,
    numbers: numbersMonth02,
    trivia: triviaMonth02,
    waffle: waffleMonth02,
    combinations: combinationsMonth02,
    spelling: spellingMonth02,
  },
  "month-03": {
    wordle: wordleMonth03,
    crossword: crosswordMonth03,
    numbers: numbersMonth03,
    trivia: triviaMonth03,
    waffle: waffleMonth03,
    combinations: combinationsMonth03,
    spelling: spellingMonth03,
  },
};
