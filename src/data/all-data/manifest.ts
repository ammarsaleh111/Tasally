import { loader as wordleLoader, months as wordleMonths } from "./games/wordle";
import { loader as crosswordLoader, months as crosswordMonths } from "./games/crossword";
import { loader as numbersLoader, months as numbersMonths } from "./games/numbers";
import { loader as triviaLoader, months as triviaMonths } from "./games/trivia";
import { loader as waffleLoader, months as waffleMonths } from "./games/waffle";
import { loader as combinationsLoader, months as combinationsMonths } from "./games/combinations";
import { loader as spellingLoader, months as spellingMonths } from "./games/spelling";
import { loader as connectionsLoader, months as connectionsMonths } from "./games/connections";
import { loader as strandsLoader, months as strandsMonths } from "./games/strands";
import { GAME_KEYS, MONTH_KEYS, type GameKey, type MonthGameMap, type MonthKey, type RawMonthDataset } from "./keys";

export * from "./keys";

export const LOADERS = {
  wordle: wordleLoader,
  crossword: crosswordLoader,
  numbers: numbersLoader,
  trivia: triviaLoader,
  waffle: waffleLoader,
  combinations: combinationsLoader,
  spelling: spellingLoader,
  connections: connectionsLoader,
  strands: strandsLoader,
};

const monthsByGame: Record<GameKey, Record<MonthKey, RawMonthDataset>> = {
  wordle: wordleMonths,
  crossword: crosswordMonths,
  numbers: numbersMonths,
  trivia: triviaMonths,
  waffle: waffleMonths,
  combinations: combinationsMonths,
  spelling: spellingMonths,
  connections: connectionsMonths,
  strands: strandsMonths,
};

export const DATASETS = Object.fromEntries(MONTH_KEYS.map((month) => [
  month,
  Object.fromEntries(GAME_KEYS.map((game) => [game, monthsByGame[game][month]])),
])) as Record<MonthKey, MonthGameMap>;
