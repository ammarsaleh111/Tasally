/**
 * GET    /api/groups/[groupId]  — Group details + members
 * DELETE /api/groups/[groupId]  — Owner deletes group
 */

import { NextRequest } from "next/server";
import { db, groups, groupMembers, identities } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { resolveIdentity, requireIdentity } from "@/lib/groups/identity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await resolveIdentity();

    // Fetch group
    const groupRows = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!groupRows[0]) {
      return fail(404, "NOT_FOUND", "Group not found");
    }

    const group = groupRows[0];

    // Check membership (if identity exists)
    let isMember = false;
    let myRole: string | null = null;
    if (identity) {
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
      if (memberRows[0]) {
        isMember = true;
        myRole = memberRows[0].role;
      }
    }

    // Fetch members with display names (single query)
    const members = await db.execute(sql`
      SELECT
        gm.identity_id,
        gm.role,
        gm.joined_at,
        i.display_name
      FROM group_members gm
      JOIN identities i ON i.id = gm.identity_id
      WHERE gm.group_id = ${groupId}
        AND gm.status = 'active'
      ORDER BY gm.role = 'owner' DESC, gm.joined_at ASC
    `);

    return ok({
      group: {
        id: group.id,
        name: group.name,
        ownerIdentityId: group.ownerIdentityId,
        createdAt: group.createdAt,
        memberCount: (members as any[]).length,
      },
      members: (members as any[]).map((m) => ({
        identityId: m.identity_id,
        displayName: m.display_name,
        role: m.role,
        joinedAt: m.joined_at,
      })),
      isMember,
      myRole,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/groups/[groupId] — Owner deletes the entire group
 * Cascading deletes handle members, results, totals, invites.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const identity = await requireIdentity();

    // Fetch group and verify ownership
    const groupRows = await db
      .select({ ownerIdentityId: groups.ownerIdentityId, name: groups.name })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!groupRows[0]) {
      return fail(404, "NOT_FOUND", "Group not found");
    }

    if (groupRows[0].ownerIdentityId !== identity.id) {
      return fail(403, "FORBIDDEN", "Only the owner can delete the group");
    }

    // Delete group (cascading deletes handle members, results, totals, invites)
    await db.delete(groups).where(eq(groups.id, groupId));

    return ok({ deleted: true, groupName: groupRows[0].name });
  } catch (error) {
    return handleApiError(error);
  }
}
