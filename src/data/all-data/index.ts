import {
  DATASETS,
  GAME_KEYS,
  MONTH_KEYS,
  type GameKey,
  type MonthKey,
} from "./manifest";
import { getCairoDateKey, getYearMonthPrefix, monthKeyFromDate } from "./utils/date";
import { validateMonthDataset } from "./utils/validate";

type DateRecord = Record<string, unknown>;

const validatedCache = new Map<string, DateRecord>();

function ensureGame(game: string): asserts game is GameKey {
  if (!GAME_KEYS.includes(game as GameKey)) {
    throw new Error(
      `[all-data] Unsupported game "${game}". Supported games: ${GAME_KEYS.join(
        ", "
      )}.`
    );
  }
}

function ensureMonth(monthKey: string): asserts monthKey is MonthKey {
  if (!MONTH_KEYS.includes(monthKey as MonthKey)) {
    throw new Error(
      `[all-data] Unsupported month key "${monthKey}". Add it in src/data/all-data/manifest.ts.`
    );
  }
}

function getValidatedMonthRecord(game: GameKey, monthKey: MonthKey): DateRecord {
  const cacheKey = `${monthKey}:${game}`;
  const cached = validatedCache.get(cacheKey);
  if (cached) return cached;

  const dataset = DATASETS[monthKey]?.[game];
  if (!dataset) {
    throw new Error(
      `[all-data] Missing dataset for game="${game}" month="${monthKey}".`
    );
  }

  const validated = validateMonthDataset(game, monthKey, dataset);
  validatedCache.set(cacheKey, validated);
  return validated;
}

function resolveFallbackDate(
  dataset: DateRecord,
  requestedDate: string
): string | null {
  const prefix = getYearMonthPrefix(requestedDate);
  const candidates = Object.keys(dataset)
    .filter((dateKey) => dateKey.startsWith(`${prefix}-`) && dateKey <= requestedDate)
    .sort((a, b) => b.localeCompare(a));

  return candidates[0] ?? null;
}

export function getMonthGameData<T>(game: GameKey, monthKey: string): Record<string, T> {
  ensureGame(game);
  ensureMonth(monthKey);
  return getValidatedMonthRecord(game, monthKey) as Record<string, T>;
}

export function getDailyGameDataWithMeta<T>(
  game: GameKey,
  dateKey: string = getCairoDateKey()
): {
  data: T;
  requestedDate: string;
  servedDate: string;
  usingFallback: boolean;
  monthKey: string;
} {
  ensureGame(game);
  const derivedMonthKey = monthKeyFromDate(dateKey);
  ensureMonth(derivedMonthKey);

  const monthData = getValidatedMonthRecord(game, derivedMonthKey);
  const direct = monthData[dateKey];
  if (direct !== undefined) {
    return {
      data: direct as T,
      requestedDate: dateKey,
      servedDate: dateKey,
      usingFallback: false,
      monthKey: derivedMonthKey,
    };
  }

  const fallbackDate = resolveFallbackDate(monthData, dateKey);
  if (fallbackDate) {
    return {
      data: monthData[fallbackDate] as T,
      requestedDate: dateKey,
      servedDate: fallbackDate,
      usingFallback: true,
      monthKey: derivedMonthKey,
    };
  }

  throw new Error(
    `[all-data] No data for game="${game}" date="${dateKey}" in month="${derivedMonthKey}", and no earlier fallback date in that month.`
  );
}

export function getDailyGameData<T>(game: GameKey, dateKey?: string): T {
  return getDailyGameDataWithMeta<T>(game, dateKey).data;
}

export type { GameKey } from "./manifest";
