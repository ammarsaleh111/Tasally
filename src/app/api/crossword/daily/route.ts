import { NextRequest, NextResponse } from "next/server";
import {
  getDailyCrosswordPayload,
  getLatestAvailableCrosswordDate,
} from "@/app/games/crossword/puzzles/puzzleCatalog";

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

    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const payload = getDailyCrosswordPayload(dateParam);
    if (!payload) {
      return NextResponse.json(
        {
          error: "No crossword puzzles are available.",
          latestAvailableDate: getLatestAvailableCrosswordDate(),
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      requestedDate: payload.requestedDate,
      servedDate: payload.servedDate,
      usingFallback: payload.usingFallback,
      latestAvailableDate: payload.latestAvailableDate,
      fallbackNotice: payload.usingFallback
        ? `Using puzzle for ${payload.servedDate}`
        : null,
      ...payload.puzzle,
    });

    response.headers.set(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (error) {
    console.error("[crossword/daily]", error);
    return NextResponse.json(
      { error: "Failed to load crossword puzzle" },
      { status: 500 }
    );
  }
}
