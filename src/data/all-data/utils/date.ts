const CAIRO_TIMEZONE = "Africa/Cairo";
const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateKey(dateKey: string): RegExpMatchArray {
  const match = dateKey.match(DATE_KEY_RE);
  if (!match) {
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
  const [, , month] = parseDateKey(dateKey);
  return `month-${month}`;
}

export function getYearMonthPrefix(dateKey: string): string {
  const [year, month] = dateKey.split("-").slice(0, 2);
  return `${year}-${month}`;
}

export function isDateKey(value: string): boolean {
  return DATE_KEY_RE.test(value);
}
