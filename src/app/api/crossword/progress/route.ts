import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { crosswordProgress, db } from "@/db";
import { getCairoDateKey } from "@/data/all-data/utils/date";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const ActiveCellSchema = z.object({
  r: z.number().int().min(0).max(99),
  c: z.number().int().min(0).max(99),
});

const HintsSchema = z.object({
  level1Count: z.number().int().min(0).max(999).optional(),
  level2Count: z.number().int().min(0).max(999).optional(),
  level3Count: z.number().int().min(0).max(999).optional(),
  revealsUsed: z.number().int().min(0).max(999).optional(),
});

const ProgressSchema = z.object({
  letters: z.array(z.array(z.string().max(1)).max(30)).max(30),
  solvedSegmentIds: z.array(z.string().max(24)).max(500).optional(),
  hintsUsed: HintsSchema.optional(),
  activeCell: ActiveCellSchema.optional(),
  direction: z.enum(["across", "down"]).optional(),
  elapsedSeconds: z.number().int().min(0).max(86400).optional(),
  savedAt: z.string().max(80).optional(),
});

const PutSchema = z.object({
  date: z.string().regex(DATE_RE).optional(),
  progress: ProgressSchema,
});

function sanitizeProgress(progress: z.infer<typeof ProgressSchema>) {
  const letters = progress.letters.map((row) =>
    row.map((value) => {
      const letter = String(value || "").trim().toUpperCase();
      return /^[A-Z]$/.test(letter) ? letter : "";
    })
  );

  const solvedSegmentIds = (progress.solvedSegmentIds || []).filter((id) =>
    /^([AD]-\d+)$/.test(id)
  );

  const hintsUsed = {
    level1Count: Math.max(0, Number(progress.hintsUsed?.level1Count || 0)),
    level2Count: Math.max(0, Number(progress.hintsUsed?.level2Count || 0)),
    level3Count: Math.max(0, Number(progress.hintsUsed?.level3Count || 0)),
    revealsUsed: Math.max(0, Number(progress.hintsUsed?.revealsUsed || 0)),
  };

  const activeCell = progress.activeCell
    ? {
        r: Math.max(0, Math.min(99, Number(progress.activeCell.r))),
        c: Math.max(0, Math.min(99, Number(progress.activeCell.c))),
      }
    : null;

  return {
    letters,
    solvedSegmentIds,
    hintsUsed,
    activeCell,
    direction: progress.direction === "down" ? "down" : "across",
    elapsedSeconds: Math.max(0, Math.min(86400, Math.floor(Number(progress.elapsedSeconds || 0)))),
    savedAt: progress.savedAt || new Date().toISOString(),
  };
}

function resolveDateKey(dateParam: string | null | undefined) {
  const key = dateParam || getCairoDateKey();
  if (!DATE_RE.test(key)) {
    return null;
  }
  return key;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateKey = resolveDateKey(request.nextUrl.searchParams.get("date"));
    if (!dateKey) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const existing = await db.query.crosswordProgress.findFirst({
      where: and(
        eq(crosswordProgress.userId, userId),
        eq(crosswordProgress.puzzleDate, dateKey)
      ),
      columns: {
        payload: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      date: dateKey,
      progress: existing?.payload ?? null,
      updatedAt: existing?.updatedAt?.toISOString?.() ?? null,
    });
  } catch (error) {
    console.error("[crossword/progress][GET]", error);
    return NextResponse.json(
      { error: "Failed to load crossword progress" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = PutSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dateKey = resolveDateKey(parsed.data.date);
    if (!dateKey) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const sanitized = sanitizeProgress(parsed.data.progress);
    const now = new Date();

    await db
      .insert(crosswordProgress)
      .values({
        userId,
        puzzleDate: dateKey,
        payload: sanitized,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [crosswordProgress.userId, crosswordProgress.puzzleDate],
        set: {
          payload: sanitized,
          updatedAt: now,
        },
      });

    return NextResponse.json({
      ok: true,
      date: dateKey,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[crossword/progress][PUT]", error);
    return NextResponse.json(
      { error: "Failed to save crossword progress" },
      { status: 500 }
    );
  }
}
