"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  type AppSession,
  clearSession,
  replaceSession,
  updateSession,
  useAppSession,
} from "@/utils/sessionManager";

function buildUserSession(nextSession: any): AppSession {
  const displayName =
    nextSession?.user?.name ??
    nextSession?.user?.email?.split("@")[0] ??
    "User";
  return {
    userId: nextSession?.user?.id ?? null,
    displayName,
    role: "USER",
    createdAt: new Date().toISOString(),
    token: null,
    version: 1,
  };
}

export default function SessionBridge() {
  const { data: nextSession, status } = useSession();
  const appSession = useAppSession();
  /** Track which userId we've already linked, to avoid repeated API calls */
  const linkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && nextSession?.user?.id) {
      const nextAppSession = buildUserSession(nextSession);
      const needsReplace =
        !appSession ||
        appSession.role !== "USER" ||
        appSession.userId !== nextAppSession.userId;

      if (needsReplace) {
        fetch("/api/admin/login", { method: "DELETE" }).catch(() => null);
        replaceSession(nextAppSession);
      }

      // ── Identity link & display name sync (once per user) ──
      // Calls POST /api/identity/link which:
      //   1. Links guest cookie identity to user (if applicable)
      //   2. Returns the canonical identity display name
      //   3. Sets/updates the identity_id cookie
      // We then override the session displayName so the UI shows
      // the identity name, NOT the Google profile name.
      if (linkedUserRef.current !== nextSession.user.id) {
        linkedUserRef.current = nextSession.user.id;
        fetch("/api/identity/link", { method: "POST" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.identity?.displayName) {
              updateSession({ displayName: data.identity.displayName });
            }
          })
          .catch(() => null);
      }

      return;
    }

    if (status === "unauthenticated" && appSession?.role === "USER") {
      linkedUserRef.current = null;
      clearSession();
    }
  }, [
    status,
    nextSession?.user?.id,
    nextSession?.user?.name,
    nextSession?.user?.email,
    appSession?.role,
    appSession?.userId,
  ]);

  return null;
}

