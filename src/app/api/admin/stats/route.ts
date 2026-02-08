import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import { db } from "@/db";
import { identities } from "@/db/groupsSchema";
import { sql } from "drizzle-orm";

/**
 * GET /api/admin/stats
 *
 * Returns real-time counts queried directly from the identities table.
 * No caching — every call hits the database.
 *
 * Response:
 *   { totalUsers: number, totalGuests: number, totalRegistered: number }
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [counts] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      totalGuests: sql<number>`count(*) filter (where ${identities.userId} is null)::int`,
      totalRegistered: sql<number>`count(*) filter (where ${identities.userId} is not null)::int`,
    })
    .from(identities);

  const response = NextResponse.json({
    totalUsers: counts.totalUsers,
    totalGuests: counts.totalGuests,
    totalRegistered: counts.totalRegistered,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
