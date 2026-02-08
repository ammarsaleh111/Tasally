import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { validateAdminSession } from "@/lib/adminAuth";
import { AuthError, ForbiddenError } from "./errors";

const ADMIN_COOKIE = "admin_session";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Login required");
  }
  return session;
}

/**
 * Non-throwing check: returns true if the current request has a valid admin session cookie.
 */
export async function isAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value;
    return await validateAdminSession(token);
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const authenticated = await validateAdminSession(token);

  if (authenticated) {
    return true;
  }

  const session = await auth();
  if (session?.user?.id) {
    throw new ForbiddenError("Forbidden");
  }

  throw new AuthError("Login required");
}

/**
 * Checks if request is from admin OR authenticated user.
 * Returns { allowed: true, isAdmin: boolean } or { allowed: false }.
 */
export async function requireAdminOrUser(): Promise<{ allowed: true; isAdmin: boolean; userId?: string }> {
  // Check admin session first (avoids forcing a NextAuth check for admins)
  const admin = await isAdminSession();
  if (admin) {
    return { allowed: true, isAdmin: true };
  }

  // Fall back to regular user auth
  const session = await auth();
  if (session?.user?.id) {
    return { allowed: true, isAdmin: false, userId: session.user.id };
  }

  throw new AuthError("Login required");
}
