/**
 * Identity Resolution Service
 *
 * Resolves the current caller (logged-in user OR guest) to an `identities` row.
 * - Authenticated users: identity linked via user_id
 * - Guests: identity linked via identity_id cookie
 *
 * Display name normalization is Unicode-safe (supports Arabic, English, etc).
 */

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db, identities } from "@/db";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface ResolvedIdentity {
  id: string;
  displayName: string;
  displayNameNorm: string;
  userId: string | null;
  guestId: string | null;
  lastRenamedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
export const IDENTITY_COOKIE = "ammar_identity_id";
export const RESULT_IDENTITY_HEADER = "X-Tasally-Identity";
export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 20;
/** Rename cooldown: 7 days in ms */
export const RENAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Allowed characters (Unicode-safe):
 *   \p{L}  = any Unicode letter (Arabic, Latin, etc.)
 *   \p{N}  = any Unicode digit
 *   _      = underscore
 *   -      = hyphen
 *   space  = literal space
 */
const ALLOWED_CHARS_RE = /^[\p{L}\p{N}_\- ]+$/u;

/** Must not start/end with underscore, hyphen, or space. */
const BAD_EDGES_RE = /^[_\- ]|[_\- ]$/;

/* ------------------------------------------------------------------ */
/*  Normalization (Unicode-safe)                                       */
/* ------------------------------------------------------------------ */

/**
 * Normalize a raw display name into { display, norm }.
 *
 * Steps:
 *   1. Trim leading/trailing whitespace
 *   2. Collapse multiple whitespace → single space (Unicode \s with /u flag)
 *   3. Apply NFKC normalization (handles Arabic presentation forms, etc.)
 *   4. norm = NFKC-normalized + lowercase (Arabic unaffected by lowercase)
 */
export function normalizeDisplayName(raw: string): { display: string; norm: string } {
  let display = raw.trim();
  display = display.replace(/\s+/gu, " ");
  display = display.normalize("NFKC");
  const norm = display.toLocaleLowerCase("en");
  return { display, norm };
}

/**
 * Validate a display name after normalization.
 * Returns error message string, or null if valid.
 */
export function validateDisplayName(display: string): string | null {
  const codePointLength = [...display].length;

  if (codePointLength < DISPLAY_NAME_MIN) {
    return `Name must be at least ${DISPLAY_NAME_MIN} characters`;
  }
  if (codePointLength > DISPLAY_NAME_MAX) {
    return `Name must be at most ${DISPLAY_NAME_MAX} characters`;
  }
  if (!ALLOWED_CHARS_RE.test(display)) {
    return "Name can only contain letters, numbers, spaces, underscores, and hyphens";
  }
  if (BAD_EDGES_RE.test(display)) {
    return "Name must not start or end with a space, underscore, or hyphen";
  }
  if (!/[\p{L}\p{N}]/u.test(display)) {
    return "Name must contain at least one letter or number";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Cookie helpers                                                     */
/* ------------------------------------------------------------------ */

/** Read identity_id from secure cookie. */
export async function getIdentityCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(IDENTITY_COOKIE)?.value ?? null;
}

/** Build the Set-Cookie header value for identity_id cookie. */
export function buildIdentityCookieHeader(identityId: string): string {
  const maxAge = 60 * 60 * 24 * 365 * 2; // 2 years
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${IDENTITY_COOKIE}=${identityId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

/* ------------------------------------------------------------------ */
/*  Identity resolution                                                */
/* ------------------------------------------------------------------ */

function rowToIdentity(row: typeof identities.$inferSelect): ResolvedIdentity {
  return {
    id: row.id,
    displayName: row.displayName,
    displayNameNorm: row.displayNameNorm,
    userId: row.userId,
    guestId: row.guestId,
    lastRenamedAt: row.lastRenamedAt?.toISOString() ?? null,
  };
}

/**
 * Resolve the current caller to an identity row.
 *
 * Priority:
 *   1. Authenticated user → look up by user_id
 *   2. Identity cookie → look up an unlinked guest identity
 *   3. null (first-time visitor — needs to claim)
 */
export async function resolveIdentity(): Promise<ResolvedIdentity | null> {
  // 1. Authenticated user
  const session = await auth();
  if (session?.user?.id) {
    const rows = await db
      .select()
      .from(identities)
      .where(eq(identities.userId, session.user.id))
      .limit(1);
    if (rows[0]) return rowToIdentity(rows[0]);
    // Logged in but no identity yet — fall through to cookie check
  }

  // 2. Cookie-based identity
  const cookieId = await getIdentityCookie();
  if (cookieId) {
    const rows = await db
      .select()
      .from(identities)
      .where(eq(identities.id, cookieId))
      .limit(1);
    const guestIdentity = rows[0];
    if (guestIdentity && guestIdentity.userId === null) return rowToIdentity(guestIdentity);
  }

  return null;
}

/** Require an identity or throw. */
export async function requireIdentity(): Promise<ResolvedIdentity> {
  const identity = await resolveIdentity();
  if (!identity) {
    throw new Error("IDENTITY_REQUIRED");
  }
  return identity;
}
