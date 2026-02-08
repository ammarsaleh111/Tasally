/**
 * GET /api/identity/me
 *
 * Resolve the current caller's identity from auth session or cookie.
 * Returns { identity, claimed: true } or { identity: null, claimed: false }.
 */

import { ok, handleApiError } from "@/server/http";
import { resolveIdentity } from "@/lib/groups/identity";

export async function GET() {
  try {
    const identity = await resolveIdentity();
    return ok({
      identity: identity ?? null,
      claimed: !!identity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
