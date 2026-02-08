/**
 * POST /api/identity/link
 *
 * Link the current cookie-based identity to the authenticated user.
 * Called automatically by the client after login/registration.
 *
 * If the user already has an identity (from a previous login), the cookie
 * identity is discarded and the existing user identity is kept.
 *
 * If the user has no identity but the cookie has one, the cookie identity
 * is linked to the user.
 *
 * This ensures: 1 user ⇄ 1 identity.
 */

import { NextRequest } from "next/server";
import { db, identities, users } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/server/http";
import {
  getIdentityCookie,
  buildIdentityCookieHeader,
} from "@/lib/groups/identity";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return fail(401, "UNAUTHORIZED", "Must be logged in");
    }

    const userId = session.user.id;

    // 1. Check if user already has an identity
    const userIdentityRows = await db
      .select()
      .from(identities)
      .where(eq(identities.userId, userId))
      .limit(1);

    if (userIdentityRows[0]) {
      // User already has an identity — set cookie to match and return it
      return ok(
        {
          identity: {
            id: userIdentityRows[0].id,
            displayName: userIdentityRows[0].displayName,
            displayNameNorm: userIdentityRows[0].displayNameNorm,
          },
          linked: false,
          message: "Already linked",
        },
        { headers: { "Set-Cookie": buildIdentityCookieHeader(userIdentityRows[0].id) } }
      );
    }

    // 2. No user identity yet — check for cookie-based (guest) identity
    const cookieId = await getIdentityCookie();
    if (cookieId) {
      const cookieIdentityRows = await db
        .select()
        .from(identities)
        .where(eq(identities.id, cookieId))
        .limit(1);

      if (cookieIdentityRows[0] && !cookieIdentityRows[0].userId) {
        // Link guest identity to user
        try {
          await db
            .update(identities)
            .set({
              userId,
              updatedAt: new Date(),
            })
            .where(eq(identities.id, cookieId));

          // "Replace his name" rule: sync users.name with identity display name
          await db
            .update(users)
            .set({
              name: cookieIdentityRows[0].displayName,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          return ok({
            identity: {
              id: cookieIdentityRows[0].id,
              displayName: cookieIdentityRows[0].displayName,
              displayNameNorm: cookieIdentityRows[0].displayNameNorm,
            },
            linked: true,
            message: "Guest identity linked to your account",
          });
        } catch (err: any) {
          // user_id unique constraint — user already has an identity (race condition)
          if (err?.code === "23505") {
            const rows = await db
              .select()
              .from(identities)
              .where(eq(identities.userId, userId))
              .limit(1);
            if (rows[0]) {
              return ok(
                {
                  identity: {
                    id: rows[0].id,
                    displayName: rows[0].displayName,
                    displayNameNorm: rows[0].displayNameNorm,
                  },
                  linked: false,
                  message: "Already linked (race resolved)",
                },
                { headers: { "Set-Cookie": buildIdentityCookieHeader(rows[0].id) } }
              );
            }
          }
          throw err;
        }
      }
    }

    // 3. No identity at all — user needs to claim one
    return ok({
      identity: null,
      linked: false,
      message: "No identity to link. Claim a display name first.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
