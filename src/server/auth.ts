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
