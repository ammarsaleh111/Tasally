"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  type AppSession,
  clearSession,
  replaceSession,
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

      return;
    }

    if (status === "unauthenticated" && appRole === "USER") {
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

