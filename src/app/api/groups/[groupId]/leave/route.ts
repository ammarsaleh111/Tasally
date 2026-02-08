/**
 * POST /api/groups/[groupId]/leave — Member leaves the group
 *
 * Rules:
 *   - Must be active member
 *   - Owner cannot leave (must delete group instead)
 *   - Removes from group_members + group_member_totals
 */

import { NextRequest } from "next/server";
import { db, groups, groupMembers, groupMemberTotals } from "@/db";
import { eq, and } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { requireIdentity } from "@/lib/groups/identity";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await requireIdentity();

    // Verify membership and role
    const memberRows = await db
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

    if (!memberRows[0]) {
      return fail(404, "NOT_A_MEMBER", "You are not a member of this group");
    }

    if (memberRows[0].role === "owner") {
      return fail(
        400,
        "OWNER_CANNOT_LEAVE",
        "Owners cannot leave. Delete the group instead."
      );
    }

    // Remove membership and totals
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.identityId, identity.id)
        )
      );

    await db
      .delete(groupMemberTotals)
      .where(
        and(
          eq(groupMemberTotals.groupId, groupId),
          eq(groupMemberTotals.identityId, identity.id)
        )
      );

    return ok({ left: true, groupId });
  } catch (error) {
    return handleApiError(error);
  }
}
