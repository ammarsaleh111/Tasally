"use client";

import { useEffect } from "react";
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
        return;
      }

      if (appSession.displayName !== nextAppSession.displayName) {
        updateSession({ displayName: nextAppSession.displayName });
      }

      return;
    }

    if (status === "unauthenticated" && appSession?.role === "USER") {
      clearSession();
    }
  }, [
    status,
    nextSession?.user?.id,
    nextSession?.user?.name,
    nextSession?.user?.email,
    appSession?.role,
    appSession?.userId,
    appSession?.displayName,
  ]);

  return null;
}
