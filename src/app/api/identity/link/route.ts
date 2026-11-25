import { auth } from "@/lib/auth";
import { ensureIdentity } from "@/lib/groups/ensureIdentity";
import { buildIdentityCookieHeader, getIdentityCookie } from "@/lib/groups/identity";
import { fail, handleApiError, ok } from "@/server/http";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return fail(401, "UNAUTHORIZED", "Must be logged in");
    const identity = await ensureIdentity(session.user.id, await getIdentityCookie());
    return ok({ identity }, { headers: {
      "Set-Cookie": buildIdentityCookieHeader(identity.id),
      "Cache-Control": "private, no-store",
    } });
  } catch (error) {
    return handleApiError(error);
  }
}
