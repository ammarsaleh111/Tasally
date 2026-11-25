/**
 * POST /api/groups          — Create a new group (limit 3 owned per identity)
 * GET  /api/groups/mine     — handled by separate route file
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, groups, groupMembers, groupMemberTotals } from "@/db";
import { eq, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";
import { MAX_GROUPS_OWNED } from "@/lib/groups/constants";
import {
  checkRateLimit,
  rateLimitResponse,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(40, "Group name must be at most 40 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const identity = await requireIdentity();

    // Rate limit: 5/min per identity
    const rl = await checkRateLimit(
      buildRateLimitKey("groups:create", identity.id),
      5,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "groups:create", identity.id);
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    // Check ownership limit
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(groups)
      .where(eq(groups.ownerIdentityId, identity.id));

    const owned = countRows[0]?.count ?? 0;
    if (owned >= MAX_GROUPS_OWNED) {
      return fail(
        403,
        "GROUP_LIMIT_REACHED",
        `You can create at most ${MAX_GROUPS_OWNED} groups`
      );
    }

    // Create group + owner membership + totals row in a transaction-like sequence
    // (Neon supports implicit transactions per statement; for atomicity we use raw SQL)
    const groupRows = await db
      .insert(groups)
      .values({
        name: parsed.data.name,
        ownerIdentityId: identity.id,
      })
      .returning({ id: groups.id, name: groups.name, createdAt: groups.createdAt });

    const group = groupRows[0];

    // Insert owner as member
    await db.insert(groupMembers).values({
      groupId: group.id,
      identityId: identity.id,
      role: "owner",
    });

    // Initialize totals row for owner
    await db.insert(groupMemberTotals).values({
      groupId: group.id,
      identityId: identity.id,
    });

    return ok(
      {
        group: {
          id: group.id,
          name: group.name,
          createdAt: group.createdAt,
          memberCount: 1,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "IDENTITY_REQUIRED") {
      return fail(
        403,
        "IDENTITY_REQUIRED",
        "Your player identity is not ready yet. Please retry."
      );
    }
    return handleApiError(error);
  }
}
