import { ensureSession, getSession, type AppSession } from "./sessionManager";

const STORAGE_PREFIX = "tasally";
const LEGACY_STORAGE_PREFIX = "ammarTimes";

/** One-time migration: copy ammarTimes:* keys to tasally:* keys */
let migrationDone = false;
function migrateOldStorageKeys() {
  if (migrationDone || typeof window === "undefined") return;
  migrationDone = true;
  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.startsWith(`${LEGACY_STORAGE_PREFIX}:`)) {
        const newKey = key.replace(`${LEGACY_STORAGE_PREFIX}:`, `${STORAGE_PREFIX}:`);
        if (!window.localStorage.getItem(newKey)) {
          window.localStorage.setItem(newKey, window.localStorage.getItem(key)!);
        }
      }
    }
  } catch {
    // Ignore migration errors
  }
}

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
  migrateOldStorageKeys();
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
  return key.startsWith(`${STORAGE_PREFIX}:`) || key.startsWith(`${LEGACY_STORAGE_PREFIX}:`);
}
