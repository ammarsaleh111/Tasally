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

export default function SessionBridge() {
  const { data: nextSession, status } = useSession();
  const appSession = useAppSession();
  const nextUserId = nextSession?.user?.id ?? null;
  const nextUserName = nextSession?.user?.name ?? null;
  const nextUserEmail = nextSession?.user?.email ?? null;
  const appRole = appSession?.role ?? null;
  const appUserId = appSession?.userId ?? null;
  /** Track which userId we've already linked, to avoid repeated API calls */
  const linkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && nextUserId) {
      const displayName = nextUserName ?? nextUserEmail?.split("@")[0] ?? "User";
      const nextAppSession: AppSession = {
        userId: nextUserId,
        displayName,
        role: "USER",
        createdAt: new Date().toISOString(),
        token: null,
        version: 1,
      };
      const needsReplace =
        !appSession ||
        appRole !== "USER" ||
        appUserId !== nextAppSession.userId;

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
      if (linkedUserRef.current !== nextUserId) {
        linkedUserRef.current = nextUserId;
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

    if (status === "unauthenticated" && appRole === "USER") {
      linkedUserRef.current = null;
      clearSession();
    }
  }, [
    status,
    nextUserId,
    nextUserName,
    nextUserEmail,
    appRole,
    appUserId,
    appSession,
  ]);

  return null;
}

