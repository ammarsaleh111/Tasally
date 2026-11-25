const CAIRO_TIMEZONE = "Africa/Cairo";
const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const LEGACY_2026_MONTHS = new Set(["2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);

function parseDateKey(dateKey: string): RegExpMatchArray {
  const match = dateKey.match(DATE_KEY_RE);
  if (!match || !isDateKey(dateKey)) {
    throw new Error(
      `[all-data/date] Invalid date key "${dateKey}". Expected YYYY-MM-DD.`
    );
  }
  return match;
}

export function getCairoDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function monthKeyFromDate(dateKey: string): string {
  const [, year, month] = parseDateKey(dateKey);
  const ym = `${year}-${month}`;
  if (LEGACY_2026_MONTHS.has(ym)) {
    return `month-${month}`;
  }
  return ym;
}

export function getYearMonthPrefix(dateKey: string): string {
  const [year, month] = dateKey.split("-").slice(0, 2);
  return `${year}-${month}`;
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
