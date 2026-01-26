import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

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
