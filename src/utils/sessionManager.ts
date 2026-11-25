import { signOut } from "next-auth/react";
import { clearGuestId, ensureGuestId } from "./guestManager";

export type SessionRole = "GUEST" | "USER" | "ADMIN";

export interface AppSession {
  userId: string | null;
  displayName: string | null;
  role: SessionRole;
  createdAt: string;
  token?: string | null;
  version: number;
}

const SESSION_VERSION = 1;
const SESSION_STORAGE_KEY = "tasally_session_v2";
const LEGACY_SESSION_KEY = "ammarTimes_session_v2";

let cachedSession: AppSession | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function normalizeSession(session: Partial<AppSession> | null): AppSession | null {
  if (!session) return null;
  return {
    userId: session.userId ?? null,
    displayName: session.displayName ?? null,
    role: (session.role ?? "GUEST") as SessionRole,
    createdAt: session.createdAt ?? new Date().toISOString(),
    token: session.token ?? null,
    version: session.version ?? SESSION_VERSION,
  };
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getIdentityPrefix(session: AppSession | null) {
  const role = (session?.role ?? "GUEST").toLowerCase();
  const userId = session?.userId ? encodeURIComponent(session.userId) : "anonymous";
  return `tasally:${role}:${userId}:`;
}

function clearNamespacedStorage(session: AppSession | null) {
  if (typeof window === "undefined") return;
  if (!session) return;
  const prefix = getIdentityPrefix(session);
  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      window.localStorage.removeItem(key);
    }
  });
}

function clearLegacyStorage() {
  if (typeof window === "undefined") return;

  const legacyKeys = new Set([
    "tasally_profile",
    "tasally_session",
    "tasally_allSessions",
    "ammarTimes_profile",
    "ammarTimes_session",
    "ammarTimes_allSessions",
    "ammar_player_profile",
    "ammar_guest_id",
    "ammarTimes_learningLog_v2",
    "ammarTimes_definitionsCache",
    "ammarTimes_lastCleanup",
    "ammarTimes_notificationPermission",
    "tasally_learningLog_v2",
    "tasally_definitionsCache",
    "tasally_lastCleanup",
    "tasally_notificationPermission",
    "lastReminderSent",
    "connections_state",
    "crossword_state",
    "crossword_state_v2",
    "activeUser",
    "currentUser",
  ]);

  const legacyPrefixes = [
    "wordle_",
    "wordle-win-celebrated-",
    "crossword-timer-",
    "crossword-win-celebrated-",
    "crossword_",
    "strands-",
    "strands-win-celebrated-",
    "spelling-",
    "spelling-win-celebrated-",
    "waffle",
    "combinations",
    "ammar-times-",
    "tasally-",
    "hint_state_",
    "strands_visual_hints_",
  ];

  const keys = Object.keys(window.localStorage);
  keys.forEach((key) => {
    if (legacyKeys.has(key)) {
      window.localStorage.removeItem(key);
      return;
    }
    if (legacyPrefixes.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
    }
  });
}

function clearSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore session storage errors
  }
}

function clearAllSessionData(previousSession: AppSession | null) {
  if (typeof window === "undefined") return;
  cachedSession = null;
  clearNamespacedStorage(previousSession);
  clearLegacyStorage();
  clearSessionStorage();
  clearGuestId();
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") {
    return cachedSession;
  }

  if (cachedSession) return cachedSession;

  try {
    let raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    // Migrate from legacy key if new key is empty
    if (!raw) {
      raw = window.localStorage.getItem(LEGACY_SESSION_KEY);
      if (raw) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, raw);
        window.localStorage.removeItem(LEGACY_SESSION_KEY);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    cachedSession = normalizeSession(parsed);
    return cachedSession;
  } catch {
    return null;
  }
}

export function setSession(session: AppSession) {
  const normalized = normalizeSession(session);
  if (!normalized) return;
  cachedSession = normalized;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized));
  }
  notify();
}

export function updateSession(patch: Partial<AppSession>) {
  const current = getSession();
  if (!current) return;
  setSession({ ...current, ...patch });
}

export function createGuestSession(): AppSession {
  const guestId = ensureGuestId();
  return {
    userId: guestId,
    displayName: null,
    role: "GUEST",
    createdAt: new Date().toISOString(),
    token: null,
    version: SESSION_VERSION,
  };
}

export function ensureSession(): AppSession {
  const existing = getSession();
  if (existing) return existing;
  const guest = createGuestSession();
  setSession(guest);
  return guest;
}

export function replaceSession(session: AppSession) {
  const previous = getSession();
  clearAllSessionData(previous);
  setSession(session);
}

export function clearSession() {
  const previous = getSession();
  clearAllSessionData(previous);
  const guest = createGuestSession();
  setSession(guest);
}

export function isAuthenticated() {
  const session = getSession();
  return !!session && session.role !== "GUEST";
}

export function isAdmin() {
  const session = getSession();
  return !!session && session.role === "ADMIN";
}

export async function logout() {
  const session = getSession();
  if (typeof window === "undefined") {
    clearSession();
    return;
  }

  if (session?.role === "ADMIN") {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } catch {
      // Ignore admin logout failures
    }
  }

  if (session?.role === "USER") {
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore sign out failures
    }
  }

  clearSession();
}

export async function handleAccountDeleted(message?: string) {
  if (typeof window === "undefined") return;

  const noticeKey = "tasally_account_deleted_notice";
  const defaultMessage = "Your account was deleted by an admin.";

  try {
    if (!window.sessionStorage.getItem(noticeKey)) {
      window.sessionStorage.setItem(noticeKey, "1");
      window.alert(message || defaultMessage);
    }
  } catch {
    window.alert(message || defaultMessage);
  }

  await logout();
  window.location.replace("/login?reason=deleted");
}

export function useAppSession() {
  // Lazy import to avoid bundling React for non-React consumers
  const { useSyncExternalStore } = require("react");
  // The prerendered page has no browser storage. Read the saved session after hydration.
  return useSyncExternalStore(subscribe, getSession, () => null);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === SESSION_STORAGE_KEY) {
      cachedSession = null;
      notify();
    }
  });
}
