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

import combinationsMonth04 from "./month-04/combinations.json";
import crosswordMonth04 from "./month-04/crossword.json";
import numbersMonth04 from "./month-04/numbers.json";
import spellingMonth04 from "./month-04/spelling.json";
import triviaMonth04 from "./month-04/trivia.json";
import waffleMonth04 from "./month-04/waffle.json";
import wordleMonth04 from "./month-04/wordle.json";

import combinationsMonth05 from "./month-05/combinations.json";
import crosswordMonth05 from "./month-05/crossword.json";
import numbersMonth05 from "./month-05/numbers.json";
import spellingMonth05 from "./month-05/spelling.json";
import triviaMonth05 from "./month-05/trivia.json";
import waffleMonth05 from "./month-05/waffle.json";
import wordleMonth05 from "./month-05/wordle.json";

import combinationsMonth06 from "./month-06/combinations.json";
import crosswordMonth06 from "./month-06/crossword.json";
import numbersMonth06 from "./month-06/numbers.json";
import spellingMonth06 from "./month-06/spelling.json";
import triviaMonth06 from "./month-06/trivia.json";
import waffleMonth06 from "./month-06/waffle.json";
import wordleMonth06 from "./month-06/wordle.json";

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

export const MONTH_KEYS = [
  "month-02",
  "month-03",
  "month-04",
  "month-05",
  "month-06",
] as const;
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
  "month-04": {
    wordle: wordleMonth04,
    crossword: crosswordMonth04,
    numbers: numbersMonth04,
    trivia: triviaMonth04,
    waffle: waffleMonth04,
    combinations: combinationsMonth04,
    spelling: spellingMonth04,
  },
  "month-05": {
    wordle: wordleMonth05,
    crossword: crosswordMonth05,
    numbers: numbersMonth05,
    trivia: triviaMonth05,
    waffle: waffleMonth05,
    combinations: combinationsMonth05,
    spelling: spellingMonth05,
  },
  "month-06": {
    wordle: wordleMonth06,
    crossword: crosswordMonth06,
    numbers: numbersMonth06,
    trivia: triviaMonth06,
    waffle: waffleMonth06,
    combinations: combinationsMonth06,
    spelling: spellingMonth06,
  },
};
