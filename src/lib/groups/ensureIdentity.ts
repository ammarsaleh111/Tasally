import { and, eq, isNull, sql } from "drizzle-orm";
import { db, identities, users } from "@/db";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function ensureIdentity(userId: string | null, cookie: string | null) {
  const cookieId = cookie && uuidPattern.test(cookie) ? cookie : null;
  return db.transaction(async (tx) => {
    if (userId) {
      // Serialize simultaneous sign-in and first-visit requests for this account.
      await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
      const [existing] = await tx.select().from(identities).where(eq(identities.userId, userId));
      if (existing) return existing;
    }

    let identity;
    if (cookieId) {
      const guest = and(eq(identities.id, cookieId), isNull(identities.userId));
      if (userId) {
        [identity] = await tx.update(identities).set({ userId, updatedAt: new Date() }).where(guest).returning();
      } else {
        [identity] = await tx.select().from(identities).where(guest);
      }
    }

    // A legacy player may already have chosen one of the generated names.
    while (!identity) {
      const [number] = await tx.execute<{ n: string }>(sql`SELECT nextval('anonymous_name_number')::text AS n`);
      const displayName = `anonymous${number.n}`;
      [identity] = await tx.insert(identities).values({ userId, displayName, displayNameNorm: displayName })
        .onConflictDoNothing({ target: identities.displayNameNorm }).returning();
    }

    if (userId) {
      await tx.update(users).set({ name: identity.displayName, updatedAt: new Date() }).where(eq(users.id, userId));
    }
    return identity;
  });
}
