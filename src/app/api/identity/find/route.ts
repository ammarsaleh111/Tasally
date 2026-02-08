/**
 * GET /api/identity/find?displayName=...
 *
 * Find a player by exact display name (case-insensitive, Unicode-normalized).
 * Returns minimal info: { identityId, displayName } or 404.
 * Rate-limited to prevent brute-force enumeration.
 */

import { NextRequest } from "next/server";
import { db, identities } from "@/db";
import { eq } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { normalizeDisplayName } from "@/lib/groups/identity";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  buildRateLimitKey,
} from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20/min per IP
    const ip = getClientIP(request);
    const rl = await checkRateLimit(
      buildRateLimitKey("identity:find", ip),
      20,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "identity:find", ip);
    }

    const displayName = request.nextUrl.searchParams.get("displayName");
    if (!displayName || displayName.trim().length === 0) {
      return fail(400, "VALIDATION_ERROR", "displayName query parameter is required");
    }

    const { norm } = normalizeDisplayName(displayName);

    const rows = await db
      .select({
        id: identities.id,
        displayName: identities.displayName,
      })
      .from(identities)
      .where(eq(identities.displayNameNorm, norm))
      .limit(1);

    if (!rows[0]) {
      return fail(404, "NOT_FOUND", "Player not found");
    }

    return ok({
      identityId: rows[0].id,
      displayName: rows[0].displayName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
