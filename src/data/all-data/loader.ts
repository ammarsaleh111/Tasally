import { MONTH_KEYS, type GameKey, type MonthKey, type RawMonthDataset } from "./keys";
import { getCairoDateKey, monthKeyFromDate } from "./utils/date";
import { validateMonthDataset } from "./utils/validate";

export class DailyPuzzleUnavailableError extends Error {
  constructor(game: string, date: string) {
    super(`No daily puzzle available for ${game} on ${date}`);
    this.name = "DailyPuzzleUnavailableError";
  }
}

export function createGameDataLoader(game: GameKey, datasets: Record<MonthKey, RawMonthDataset>) {
  const validated = new Map<MonthKey, RawMonthDataset>();

  function getMonthGameData<T>(month: string): Record<string, T> {
    const monthKey = month as MonthKey;
    if (!MONTH_KEYS.includes(monthKey)) {
      throw new Error(`[all-data] Unsupported month key "${month}". Add it in src/data/all-data/keys.ts.`);
    }
    let records = validated.get(monthKey);
    if (!records) {
      const dataset = datasets[monthKey];
      if (!dataset) throw new Error(`[all-data] Missing dataset for game="${game}" month="${monthKey}".`);
      records = validateMonthDataset(game, monthKey, dataset);
      validated.set(monthKey, records);
    }
    return records as Record<string, T>;
  }

  function getDailyGameDataWithMeta<T>(date = getCairoDateKey()) {
    const monthKey = monthKeyFromDate(date) as MonthKey;
    if (!MONTH_KEYS.includes(monthKey)) throw new DailyPuzzleUnavailableError(game, date);
    const data = getMonthGameData<T>(monthKey)[date];
    if (data === undefined) throw new DailyPuzzleUnavailableError(game, date);

    return { data, requestedDate: date, servedDate: date, usingFallback: false, monthKey };
  }

  return {
    getMonthGameData,
    getDailyGameDataWithMeta,
    getDailyGameData<T>(date?: string): T {
      return getDailyGameDataWithMeta<T>(date).data;
    },
    getAllGameData<T>(): Record<string, T> {
      return Object.assign({}, ...MONTH_KEYS.map((month) => getMonthGameData<T>(month)));
    },
  };
}
