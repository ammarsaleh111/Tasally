/**
 * POST /api/invites/[inviteId]/respond
 *
 * Accept or decline a group invite.
 *
 * Body: { action: 'accept' | 'decline' }
 *
 * On accept: adds member + initializes totals row.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { db, groupInvites, groupMembers, groupMemberTotals } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";
import { MAX_GROUP_MEMBERS } from "@/lib/groups/constants";

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { inviteId } = await params;
    const identity = await requireIdentity();

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return fail(422, "VALIDATION_ERROR", "Invalid input", {
        issues: parsed.error.flatten(),
      });
    }

    const { action } = parsed.data;

    // Fetch the invite
    const inviteRows = await db
      .select()
      .from(groupInvites)
      .where(eq(groupInvites.id, inviteId))
      .limit(1);

    const invite = inviteRows[0];
    if (!invite) {
      return fail(404, "NOT_FOUND", "Invite not found");
    }

    // Must be the invitee
    if (invite.inviteeIdentityId !== identity.id) {
      return fail(403, "FORBIDDEN", "This invite is not for you");
    }

    // Must be pending
    if (invite.status !== "pending") {
      return fail(409, "ALREADY_RESPONDED", "This invite has already been responded to");
    }

    // Check expiry
    if (new Date() > invite.expiresAt) {
      await db
        .update(groupInvites)
        .set({ status: "expired" })
        .where(eq(groupInvites.id, inviteId));
      return fail(410, "INVITE_EXPIRED", "This invite has expired");
    }

    if (action === "decline") {
      await db
        .update(groupInvites)
        .set({ status: "declined" })
        .where(eq(groupInvites.id, inviteId));

      return ok({ status: "declined" });
    }

    // Accept flow
    // Check member count limit
    const countRows = await db.execute(sql`
      SELECT count(*)::int AS cnt FROM group_members WHERE group_id = ${invite.groupId}
    `);
    if ((countRows as any[])[0]?.cnt >= MAX_GROUP_MEMBERS) {
      return fail(
        403,
        "GROUP_FULL",
        `Group has reached the maximum of ${MAX_GROUP_MEMBERS} members`
      );
    }

    // Check not already a member (idempotency)
    const existing = await db
      .select({ identityId: groupMembers.identityId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, invite.groupId),
          eq(groupMembers.identityId, identity.id)
        )
      )
      .limit(1);

    if (!existing[0]) {
      // Add to group_members
      await db.insert(groupMembers).values({
        groupId: invite.groupId,
        identityId: identity.id,
        role: "member",
      });

      // Initialize totals row
      await db
        .insert(groupMemberTotals)
        .values({
          groupId: invite.groupId,
          identityId: identity.id,
        })
        .onConflictDoNothing();
    }

    // Mark invite accepted
    await db
      .update(groupInvites)
      .set({ status: "accepted" })
      .where(eq(groupInvites.id, inviteId));

    return ok({ status: "accepted", groupId: invite.groupId });
  } catch (error: any) {
    if (error?.message === "IDENTITY_REQUIRED") {
      return fail(403, "IDENTITY_REQUIRED", "Your player identity is not ready yet. Please retry.");
    }
    return handleApiError(error);
  }
}
