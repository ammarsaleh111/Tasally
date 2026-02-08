/**
 * GET /api/groups/mine
 *
 * List groups where the current identity is a member.
 * Returns group info + member count (single efficient query).
 */

import { db, groups, groupMembers } from "@/db";
import { eq, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { resolveIdentity } from "@/lib/groups/identity";

export async function GET() {
  try {
    const identity = await resolveIdentity();
    if (!identity) {
      return ok({ groups: [] });
    }

    // Single query: join group_members → groups, with subquery for member count
    const rows = await db.execute(sql`
      SELECT
        g.id,
        g.name,
        g.owner_identity_id,
        g.created_at,
        gm.role,
        (SELECT count(*)::int FROM group_members m2 WHERE m2.group_id = g.id) AS member_count
      FROM group_members gm
      JOIN groups g ON g.id = gm.group_id
      WHERE gm.identity_id = ${identity.id}
        AND gm.status = 'active'
      ORDER BY gm.joined_at DESC
    `);

    const result = (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      ownerIdentityId: r.owner_identity_id,
      createdAt: r.created_at,
      role: r.role,
      memberCount: r.member_count,
    }));

    return ok({ groups: result });
  } catch (error) {
    return handleApiError(error);
  }
}
