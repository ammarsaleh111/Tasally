/**
 * POST /api/groups/[groupId]/kick — Owner kicks a member
 *
 * Body: { identityId: string }
 *
 * Rules:
 *   - Only owner can kick
 *   - Cannot kick self
 *   - Removes from group_members + group_member_totals
 *   - Game results remain for historical purposes
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, groups, groupMembers, groupMemberTotals } from "@/db";
import { eq, and } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";
import {
  checkRateLimit,
  rateLimitResponse,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const kickSchema = z.object({
  identityId: z.string().uuid("Invalid identity ID"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await requireIdentity();

    // Rate limit: 10 kicks per minute per identity
    const rl = await checkRateLimit(
      buildRateLimitKey("groups:kick", identity.id),
      10,
      60
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "groups:kick", identity.id);
    }

    // Parse body
    const body = await request.json();
    const parsed = kickSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    const { identityId: targetId } = parsed.data;

    // Cannot kick self
    if (targetId === identity.id) {
      return fail(400, "CANNOT_KICK_SELF", "You cannot kick yourself");
    }

    // Verify requester is owner
    const ownerCheck = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, identity.id),
          eq(groupMembers.status, "active")
        )
      )
      .limit(1);

    if (!ownerCheck[0] || ownerCheck[0].role !== "owner") {
      return fail(403, "FORBIDDEN", "Only the owner can kick members");
    }

    // Verify target is a member
    const targetCheck = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, targetId),
          eq(groupMembers.status, "active")
        )
      )
      .limit(1);

    if (!targetCheck[0]) {
      return fail(404, "NOT_A_MEMBER", "Target is not a member of this group");
    }

    // Remove membership and totals
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, targetId)
        )
      );

    await db
      .delete(groupMemberTotals)
      .where(
        and(
          eq(groupMemberTotals.groupId, groupId),
          eq(groupMemberTotals.identityId, targetId)
        )
      );

    return ok({ kicked: true, identityId: targetId, groupId });
  } catch (error) {
    return handleApiError(error);
  }
}
