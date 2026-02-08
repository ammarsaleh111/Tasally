import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import { db } from "@/db";
import { identities } from "@/db/groupsSchema";
import { sql, desc, ilike } from "drizzle-orm";

/**
 * GET /api/admin/users
 *
 * Lists ALL identities (guests + registered) with pagination and search.
 *
 * Query params:
 *   query  — partial match against display_name_norm (case-insensitive)
 *   page   — 1-based page number (default 1)
 *   limit  — items per page (default 25, max 100)
 *
 * Each row includes:
 *   id, displayName, userType ("guest" | "registered"), createdAt
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get("query") ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10) || 25));
  const offset = (page - 1) * limit;

  // Normalize search the same way display_name_norm is stored
  const searchNorm = rawQuery.toLowerCase().replace(/\s+/g, " ").trim();

  const whereCondition = searchNorm
    ? ilike(identities.displayNameNorm, `%${searchNorm}%`)
    : undefined;

  // Count total matching rows (for pagination)
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(identities)
    .where(whereCondition);

  const total = countRow.total;

  // Fetch page
  const rows = await db
    .select({
      id: identities.id,
      displayName: identities.displayName,
      userId: identities.userId,
      createdAt: identities.createdAt,
    })
    .from(identities)
    .where(whereCondition)
    .orderBy(desc(identities.createdAt))
    .limit(limit)
    .offset(offset);

  const users = rows.map((row) => ({
    id: row.id,
    displayName: row.displayName || "Anonymous",
    userType: row.userId ? ("registered" as const) : ("guest" as const),
    status: "Active",
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  }));

  const totalPages = Math.ceil(total / limit);

  const response = NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages },
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
