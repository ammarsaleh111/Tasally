import { GAME_KEYS, type GameKey } from "./keys";
import { LOADERS } from "./manifest";

export { DailyPuzzleUnavailableError } from "./loader";

function loaderFor(game: GameKey) {
  if (!GAME_KEYS.includes(game)) {
    throw new Error(`[all-data] Unsupported game "${game}". Supported games: ${GAME_KEYS.join(", ")}.`);
  }
  return LOADERS[game];
}

export function getMonthGameData<T>(game: GameKey, month: string): Record<string, T> {
  return loaderFor(game).getMonthGameData<T>(month);
}

export function getAllGameData<T>(game: GameKey): Record<string, T> {
  return loaderFor(game).getAllGameData<T>();
}

export function getDailyGameDataWithMeta<T>(game: GameKey, date?: string) {
  return loaderFor(game).getDailyGameDataWithMeta<T>(date);
}

export function getDailyGameData<T>(game: GameKey, date?: string): T {
  return loaderFor(game).getDailyGameData<T>(date);
}
