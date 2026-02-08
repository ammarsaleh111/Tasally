import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/adminAuth";
import {
  accounts,
  gameEvents,
  gameResults,
  guestProfiles,
  presenceSessions,
  sessions,
  themeSettings,
  users,
  verificationTokens,
  globalGameResults,
  globalPlayerTotals,
  db,
} from "@/db";
import {
  identities,
  groupMembers,
  groupGameResults,
  groupMemberTotals,
  groupInvites,
  groups,
} from "@/db/groupsSchema";
import { eq } from "drizzle-orm";
import { sanitizeString } from "@/utils/inputSanitizer";

/**
 * DELETE /api/admin/users/:identityId
 *
 * Deletes a registered user by their identity ID.
 * Rejects deletion of guest identities with CANNOT_DELETE_GUEST.
 *
 * Cascade deletes (atomic transaction):
 *   - group memberships, group game results, group member totals
 *   - group invites (sent & received)
 *   - groups owned by this identity
 *   - global game results & player totals
 *   - game results, game events, presence sessions
 *   - auth sessions, accounts, verification tokens
 *   - theme settings references
 *   - the users row
 *   - the identity row
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id?: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const authenticated = await validateAdminSession(token);

  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const identityId = sanitizeString(params?.id ?? "", 100);

  if (!identityId) {
    return NextResponse.json({ error: "Missing identity ID" }, { status: 400 });
  }

  // Load identity
  const [identity] = await db
    .select({
      id: identities.id,
      userId: identities.userId,
      displayName: identities.displayName,
    })
    .from(identities)
    .where(eq(identities.id, identityId))
    .limit(1);

  if (!identity) {
    return NextResponse.json({ error: "Identity not found" }, { status: 404 });
  }

  // Reject guest deletion
  if (!identity.userId) {
    return NextResponse.json(
      { error: "CANNOT_DELETE_GUEST", message: "Guest accounts cannot be deleted" },
      { status: 403 }
    );
  }

  const userId = identity.userId;

  // Load user row for email (needed for verification token cleanup)
  const [userRow] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Don't allow deleting admins
  if (userRow.role !== "USER") {
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Group-related cascade
      await tx.delete(groupMemberTotals).where(eq(groupMemberTotals.identityId, identityId));
      await tx.delete(groupGameResults).where(eq(groupGameResults.identityId, identityId));
      await tx.delete(groupMembers).where(eq(groupMembers.identityId, identityId));
      await tx.delete(groupInvites).where(eq(groupInvites.inviterIdentityId, identityId));
      await tx.delete(groupInvites).where(eq(groupInvites.inviteeIdentityId, identityId));
      // Delete groups owned by this identity (cascade will delete members/results/invites)
      await tx.delete(groups).where(eq(groups.ownerIdentityId, identityId));

      // 2. Global leaderboard data
      await tx.delete(globalGameResults).where(eq(globalGameResults.identityId, identityId));
      await tx.delete(globalPlayerTotals).where(eq(globalPlayerTotals.identityId, identityId));

      // 3. Legacy game data (userId-based)
      await tx.delete(gameResults).where(eq(gameResults.userId, userId));
      await tx.delete(gameEvents).where(eq(gameEvents.userId, userId));
      await tx.delete(presenceSessions).where(eq(presenceSessions.userId, userId));

      // 4. Auth data
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      if (userRow.email) {
        await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, userRow.email));
      }

      // 5. Theme settings references
      await tx
        .update(themeSettings)
        .set({ updatedByUserId: null })
        .where(eq(themeSettings.updatedByUserId, userId));

      // 6. Delete user row
      await tx.delete(users).where(eq(users.id, userId));

      // 7. Delete identity row
      await tx.delete(identities).where(eq(identities.id, identityId));
    });
  } catch (error) {
    console.error("[admin/users/:id] failed to delete user", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

