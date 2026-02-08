/**
 * POST /api/identity/rename
 *
 * Rename the current identity's display name.
 * Enforces 7-day cooldown via last_renamed_at.
 * Supports Arabic + Unicode names.
 *
 * Body: { displayName: string }
 * Returns: { identity: { id, displayName, displayNameNorm, lastRenamedAt } }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, identities, users } from "@/db";
import { eq } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import {
  normalizeDisplayName,
  validateDisplayName,
  resolveIdentity,
  RENAME_COOLDOWN_MS,
} from "@/lib/groups/identity";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIP,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const renameSchema = z.object({
  displayName: z.string().min(1).max(60),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5/min per IP
    const ip = getClientIP(request);
    const rl = await checkRateLimit(
      buildRateLimitKey("identity:rename", ip),
      5,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "identity:rename", ip);
    }

    // Must have an identity to rename
    const identity = await resolveIdentity();
    if (!identity) {
      return fail(401, "IDENTITY_REQUIRED", "You must claim a display name first");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = renameSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Display name is required");
    }

    // Check cooldown
    if (identity.lastRenamedAt) {
      const lastRenamed = new Date(identity.lastRenamedAt).getTime();
      const elapsed = Date.now() - lastRenamed;
      if (elapsed < RENAME_COOLDOWN_MS) {
        const remainingDays = Math.ceil((RENAME_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
        return fail(
          429,
          "RENAME_COOLDOWN",
          `You can rename again in ${remainingDays} day${remainingDays !== 1 ? "s" : ""}`
        );
      }
    }

    // Normalize (Unicode-safe)
    const { display, norm } = normalizeDisplayName(parsed.data.displayName);

    // Validate
    const formatError = validateDisplayName(display);
    if (formatError) {
      return fail(422, "VALIDATION_ERROR", formatError);
    }

    // Same name check
    if (norm === identity.displayNameNorm) {
      return fail(422, "VALIDATION_ERROR", "New name is the same as current name");
    }

    // Update
    try {
      const now = new Date();
      await db
        .update(identities)
        .set({
          displayName: display,
          displayNameNorm: norm,
          lastRenamedAt: now,
          updatedAt: now,
        })
        .where(eq(identities.id, identity.id));

      // "Replace his name" rule: sync users.name
      if (identity.userId) {
        await db
          .update(users)
          .set({ name: display, updatedAt: now })
          .where(eq(users.id, identity.userId));
      }

      return ok({
        identity: {
          id: identity.id,
          displayName: display,
          displayNameNorm: norm,
          lastRenamedAt: now.toISOString(),
        },
      });
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
