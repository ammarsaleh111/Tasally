/**
 * GET /api/invites/mine
 *
 * List pending invites for the current identity.
 * Includes group name + inviter display name (single query, no N+1).
 */

import { db, groupInvites, groups, identities } from "@/db";
import { sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/server/http";
import { resolveIdentity } from "@/lib/groups/identity";

export async function GET() {
  try {
    const identity = await resolveIdentity();
    if (!identity) {
      return ok({ invites: [] });
    }

    // Single efficient query with JOINs — no N+1
    const rows = await db.execute(sql`
      SELECT
        gi.id,
        gi.group_id,
        gi.status,
        gi.created_at,
        gi.expires_at,
        g.name AS group_name,
        inv.display_name AS inviter_display_name
      FROM group_invites gi
      JOIN groups g ON g.id = gi.group_id
      JOIN identities inv ON inv.id = gi.inviter_identity_id
      WHERE gi.invitee_identity_id = ${identity.id}
        AND gi.status = 'pending'
        AND gi.expires_at > now()
      ORDER BY gi.created_at DESC
      LIMIT 50
    `);

    const invites = (rows as any[]).map((r) => ({
      id: r.id,
      groupId: r.group_id,
      groupName: r.group_name,
      inviterDisplayName: r.inviter_display_name,
      status: r.status,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    }));

    return ok({ invites });
  } catch (error) {
    return handleApiError(error);
  }
}
