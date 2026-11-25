/**
 * GET /api/identity/me
 *
 * Resolve the current caller's identity from auth session or cookie.
 * Returns { identity, claimed: true } or { identity: null, claimed: false }.
 */

import { ok, handleApiError } from "@/server/http";
import { ensureIdentity } from "@/lib/groups/ensureIdentity";
import { auth } from "@/lib/auth";
import { resolveIdentity, getIdentityCookie, buildIdentityCookieHeader } from "@/lib/groups/identity";

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


// Only the explicit browser initialization request allocates a player number.
export async function POST() {
  try {
    const session = await auth();
    const cookie = await getIdentityCookie();
    const identity = await ensureIdentity(session?.user?.id ?? null, cookie);
    const headers = new Headers({ "Cache-Control": "private, no-store" });
    if (cookie !== identity.id) headers.set("Set-Cookie", buildIdentityCookieHeader(identity.id));
    return ok({ identity }, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}
