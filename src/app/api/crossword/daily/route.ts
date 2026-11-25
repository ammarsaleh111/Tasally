import { NextRequest, NextResponse } from "next/server";
import { DailyPuzzleUnavailableError, getDailyGameDataWithMeta, getMonthGameData } from "@/data/all-data";
import { isDateKey, monthKeyFromDate } from "@/data/all-data/utils/date";

/**
 * GET /api/crossword/daily?date=YYYY-MM-DD
 *
 * Deterministic daily crossword endpoint:
 * - Uses explicit date when provided
 * - Uses Cairo date server-side when omitted
 * - Never returns random/mystery puzzles
 * - Falls back to latest available puzzle when missing
 */
export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get("date") ?? undefined;

    if (dateParam !== undefined && !isDateKey(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const payload = getDailyGameDataWithMeta<Record<string, unknown>>(
      "crossword",
      dateParam
    );
    const monthData = getMonthGameData("crossword", monthKeyFromDate(payload.requestedDate));
    const latestAvailableDate = Object.keys(monthData).sort().at(-1) ?? null;

    const response = NextResponse.json({
      requestedDate: payload.requestedDate,
      servedDate: payload.servedDate,
      usingFallback: payload.usingFallback,
      latestAvailableDate,
      fallbackNotice: payload.usingFallback
        ? `Using puzzle for ${payload.servedDate}`
        : null,
      ...(payload.data ?? {}),
    });

    response.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    if (error instanceof DailyPuzzleUnavailableError) {
      return NextResponse.json(
        { error: "No daily crossword is available for this date", code: "PUZZLE_UNAVAILABLE" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    console.error("[crossword/daily]", error);
    return NextResponse.json(
      { error: "Failed to load crossword puzzle" },
      { status: 500 }
    );
  }
}
