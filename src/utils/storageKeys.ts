import { ensureSession, getSession, type AppSession } from "./sessionManager";

const STORAGE_PREFIX = "ammarTimes";

function toSafeSegment(value: string) {
  return encodeURIComponent(value);
}

function getIdentitySegment(session: AppSession | null) {
  if (!session) {
    return "guest:anonymous";
  }
  const role = (session.role || "GUEST").toLowerCase();
  const userId = session.userId ? toSafeSegment(session.userId) : "anonymous";
  return `${role}:${userId}`;
}

export function getUserStorageKey(baseKey: string, sessionOverride?: AppSession | null) {
  if (typeof window === "undefined") {
    return baseKey;
  }
  const session = sessionOverride ?? ensureSession();
  const segment = getIdentitySegment(session);
  return `${STORAGE_PREFIX}:${segment}:${baseKey}`;
}

export function getUserStoragePrefix(sessionOverride?: AppSession | null) {
  if (typeof window === "undefined") {
    return `${STORAGE_PREFIX}:`;
  }
  const session = sessionOverride ?? getSession();
  const segment = getIdentitySegment(session);
  return `${STORAGE_PREFIX}:${segment}:`;
}

export function isNamespacedKey(key: string) {
  return key.startsWith(`${STORAGE_PREFIX}:`);
}
