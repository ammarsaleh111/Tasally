/**
 * POST /api/identity/claim
 *
 * Claim a unique display name (first-time) or update it (for existing identity).
 * Supports Arabic + English + Unicode names.
 *
 * Body: { displayName: string }
 * Returns: { identity: { id, displayName, displayNameNorm } }
 *
 * For guests: creates a new identity with a cookie.
 * For logged-in users: creates identity linked to user_id, sets users.name.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, identities, users } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/server/http";
import {
  normalizeDisplayName,
  validateDisplayName,
  resolveIdentity,
  buildIdentityCookieHeader,
} from "@/lib/groups/identity";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const claimSchema = z.object({
  displayName: z.string().min(1).max(60),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10/min per IP
    const ip = getClientIP(request);
    const rl = await checkRateLimit(
      buildRateLimitKey("identity:claim", ip),
      10,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "identity:claim", ip);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Display name is required");
    }

    // Normalize (Unicode-safe: Arabic, English, etc.)
    const { display, norm } = normalizeDisplayName(parsed.data.displayName);

    // Validate format
    const formatError = validateDisplayName(display);
    if (formatError) {
      return fail(422, "VALIDATION_ERROR", formatError);
    }

    // Determine the caller
    const session = await auth();
    const userId = session?.user?.id ?? null;

    // Check if caller already has an identity
    const existing = await resolveIdentity();

    if (existing) {
      // Update existing identity's display name
      try {
        await db
          .update(identities)
          .set({
            displayName: display,
            displayNameNorm: norm,
            updatedAt: new Date(),
          })
          .where(eq(identities.id, existing.id));

        // "Replace his name" rule: sync users.name
        if (existing.userId) {
          await db
            .update(users)
            .set({ name: display, updatedAt: new Date() })
            .where(eq(users.id, existing.userId));
        }

        return ok({ identity: { id: existing.id, displayName: display, displayNameNorm: norm } });
      } catch (err: any) {
        if (err?.code === "23505") {
          return fail(409, "NAME_TAKEN", "This display name is already taken");
        }
        throw err;
      }
    }

    // Create new identity
    try {
      const values: any = {
        displayName: display,
        displayNameNorm: norm,
      };

      // Link to user if logged in
      if (userId) {
        values.userId = userId;
      }

      const rows = await db
        .insert(identities)
        .values(values)
        .returning({ id: identities.id });

      const newId = rows[0].id;

      // "Replace his name" rule: sync users.name
      if (userId) {
        await db
          .update(users)
          .set({ name: display, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }

      // Return with Set-Cookie header for identity persistence
      return ok(
        { identity: { id: newId, displayName: display, displayNameNorm: norm } },
        { 
          status: 201,
          headers: { "Set-Cookie": buildIdentityCookieHeader(newId) }
        }
      );
    } catch (err: any) {
      if (err?.code === "23505") {
        return fail(409, "NAME_TAKEN", "This display name is already taken");
      }
      throw err;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
