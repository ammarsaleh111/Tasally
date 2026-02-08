import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { identities } from "@/db/groupsSchema";
import { z } from "zod";
import { cookies } from "next/headers";

const IDENTITY_COOKIE = "ammar_identity_id";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/* ------------------------------------------------------------------ */
/*  Identity linking — runs inside signIn callback for ALL providers   */
/* ------------------------------------------------------------------ */

/**
 * Ensures the authenticated user has exactly one identity row with
 * user_id set. Links an existing guest identity from cookie, or
 * creates a new identity if none exists.
 *
 * Also syncs users.name ← identity.display_name so that the identity
 * display name is the single source of truth everywhere.
 */
async function linkIdentityOnSignIn(userId: string, fallbackName: string | null) {
  try {
    // Read identity cookie from the incoming request
    let cookieIdentityId: string | null = null;
    try {
      const cookieStore = await cookies();
      cookieIdentityId = cookieStore.get(IDENTITY_COOKIE)?.value ?? null;
    } catch {
      // cookies() may fail in some edge cases — proceed without cookie
    }

    // 1. Does user already have a linked identity?
    const [existingUserIdentity] = await db
      .select()
      .from(identities)
      .where(eq(identities.userId, userId))
      .limit(1);

    if (existingUserIdentity) {
      // Sync users.name with the canonical identity display name
      await db
        .update(users)
        .set({ name: existingUserIdentity.displayName, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return;
    }

    // 2. No user identity yet — try to link the cookie (guest) identity
    if (cookieIdentityId) {
      const [cookieIdentity] = await db
        .select()
        .from(identities)
        .where(eq(identities.id, cookieIdentityId))
        .limit(1);

      if (cookieIdentity && !cookieIdentity.userId) {
        // Guest identity exists and is unlinked — link it to this user
        try {
          await db
            .update(identities)
            .set({ userId, updatedAt: new Date() })
            .where(eq(identities.id, cookieIdentityId));

          // Sync users.name with identity display name
          await db
            .update(users)
            .set({ name: cookieIdentity.displayName, updatedAt: new Date() })
            .where(eq(users.id, userId));

          return;
        } catch (err: any) {
          // 23505 = unique violation — user_id unique index race condition
          if (err?.code === "23505") {
            const [raceResolved] = await db
              .select()
              .from(identities)
              .where(eq(identities.userId, userId))
              .limit(1);
            if (raceResolved) {
              await db
                .update(users)
                .set({ name: raceResolved.displayName, updatedAt: new Date() })
                .where(eq(users.id, userId));
              return;
            }
          }
          // Fall through to create a new identity
        }
      }
      // If cookie identity is already linked to another user, or doesn't exist,
      // fall through and create a new identity for this user.
    }

    // 3. No identity at all — create one from fallback name
    await createIdentityForUser(userId, fallbackName);
  } catch (error) {
    console.error("[auth] linkIdentityOnSignIn failed:", error);
    // Never block sign-in — identity can be linked later via /api/identity/link
  }
}

/**
 * Creates a new identity for a user. Handles display_name_norm collisions
 * by appending a random numeric suffix.
 */
async function createIdentityForUser(userId: string, fallbackName: string | null) {
  const raw = (fallbackName || "Player").trim().replace(/\s+/g, " ").normalize("NFKC");
  const display = raw.slice(0, 20);
  const norm = display.toLocaleLowerCase("en");

  try {
    const [created] = await db
      .insert(identities)
      .values({ userId, displayName: display, displayNameNorm: norm })
      .returning();

    await db
      .update(users)
      .set({ name: created.displayName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (err: any) {
    if (err?.code === "23505") {
      // Name taken OR user_id race — try with suffix
      const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const suffixed = `${display.slice(0, 15)} ${suffix}`;
      const suffixedNorm = suffixed.toLocaleLowerCase("en");

      try {
        const [created] = await db
          .insert(identities)
          .values({ userId, displayName: suffixed, displayNameNorm: suffixedNorm })
          .returning();

        await db
          .update(users)
          .set({ name: created.displayName, updatedAt: new Date() })
          .where(eq(users.id, userId));
      } catch {
        // If even the suffixed insert fails, the user will be prompted via NamePrompt
        console.error("[auth] createIdentityForUser: suffixed insert also failed");
      }
    } else {
      throw err;
    }
  }
}

const providers = [
  googleClientId && googleClientSecret
    ? Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      })
    : null,
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!existing || !existing.passwordHash) return null;

      const valid = await bcrypt.compare(password, existing.passwordHash);
      if (!valid) return null;

      return {
        id: existing.id,
        email: existing.email ?? undefined,
        name: existing.name ?? undefined,
        image: existing.image ?? undefined,
      };
    },
  }),
].filter(Boolean) as any[];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, profile.email),
        });

        if (!existing) {
          const [created] = await db
            .insert(users)
            .values({
              email: profile.email,
              name: profile.name ?? null,
              image: profile.picture ?? null,
              emailVerified: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          (user as any).id = created.id;
        } else {
          (user as any).id = existing.id;
          await db
            .update(users)
            .set({ updatedAt: new Date() })
            .where(eq(users.id, existing.id));
        }
      }

      // ── Identity linking (ALL providers) ──
      // Ensures the user has an identity row with user_id set.
      // For Google: links the guest cookie identity or creates a new one.
      // For Credentials: same logic as a safety net.
      const userId = (user as any).id;
      if (userId) {
        await linkIdentityOnSignIn(userId, (user as any).name ?? null);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
