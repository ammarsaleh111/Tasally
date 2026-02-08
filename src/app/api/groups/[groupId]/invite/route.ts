/**
 * POST /api/groups/[groupId]/invite
 *
 * Invite a player to join a group by their identity ID.
 * Only the owner can invite.
 *
 * Body: { inviteeIdentityId: string }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, groupMembers, groupInvites } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";
import { MAX_GROUP_MEMBERS, INVITE_EXPIRY_DAYS } from "@/lib/groups/constants";
import {
  checkRateLimit,
  rateLimitResponse,
  buildRateLimitKey,
} from "@/lib/rateLimit";

const inviteSchema = z.object({
  inviteeIdentityId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await requireIdentity();

    // Rate limit: 30/hour per identity
    const rl = await checkRateLimit(
      buildRateLimitKey("groups:invite", identity.id),
      30,
      3600
    );
    if (!rl.allowed) {
      return rateLimitResponse(rl, "groups:invite", identity.id);
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    const { inviteeIdentityId } = parsed.data;

    // Cannot invite yourself
    if (inviteeIdentityId === identity.id) {
      return fail(400, "CANNOT_INVITE_SELF", "You cannot invite yourself");
    }

    // Check caller is owner of this group
    const memberRows = await db
      .select({ role: groupMembers.role })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, identity.id)
        )
      )
      .limit(1);

    if (!memberRows[0] || memberRows[0].role !== "owner") {
      return fail(403, "FORBIDDEN", "Only the group owner can invite members");
    }

    // Check invitee is not already a member
    const existingMember = await db
      .select({ identityId: groupMembers.identityId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, inviteeIdentityId)
        )
      )
      .limit(1);

    if (existingMember[0]) {
      return fail(409, "ALREADY_MEMBER", "This player is already in the group");
    }

    // Check group member count limit
    const countRows = await db.execute(sql`
      SELECT count(*)::int AS cnt FROM group_members WHERE group_id = ${groupId}
    `);
    if ((countRows as any[])[0]?.cnt >= MAX_GROUP_MEMBERS) {
      return fail(
        403,
        "GROUP_FULL",
        `Group has reached the maximum of ${MAX_GROUP_MEMBERS} members`
      );
    }

    // Check for existing pending invite
    const existingInvite = await db
      .select({ id: groupInvites.id })
      .from(groupInvites)
      .where(
        and(
          eq(groupInvites.groupId, groupId),
          eq(groupInvites.inviteeIdentityId, inviteeIdentityId),
          eq(groupInvites.status, "pending")
        )
      )
      .limit(1);

    if (existingInvite[0]) {
      return fail(
        409,
        "INVITE_ALREADY_PENDING",
        "An invite is already pending for this player"
      );
    }

    // Create invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const rows = await db
      .insert(groupInvites)
      .values({
        groupId,
        inviterIdentityId: identity.id,
        inviteeIdentityId,
        expiresAt,
      })
      .returning({
        id: groupInvites.id,
        createdAt: groupInvites.createdAt,
        expiresAt: groupInvites.expiresAt,
      });

    return ok({ invite: rows[0] }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "IDENTITY_REQUIRED") {
      return fail(403, "IDENTITY_REQUIRED", "You must claim a display name first");
    }
    return handleApiError(error);
  }
}
