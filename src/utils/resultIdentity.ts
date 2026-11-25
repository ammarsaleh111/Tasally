import { getUserStoragePrefix } from "./storageKeys";

export const RESULT_IDENTITY_HEADER = "X-Tasally-Identity";

export function isResultEndpoint(endpoint: string) {
  return endpoint === "/api/results" || endpoint === "/api/games/global/results"
    || /^\/api\/groups\/[^/]+\/results$/.test(endpoint);
}

export function resultIdentityStorageKey() {
  // Retain the scoped binding when transient session changes clear game state.
  return `tasally:offline-owner:${getUserStoragePrefix()}resultIdentity`;
}

export function storeResultIdentity(key: string, identityId: string | null) {
  try {
    if (key !== resultIdentityStorageKey()) return;
    if (identityId) localStorage.setItem(key, JSON.stringify(identityId));
    else localStorage.removeItem(key);
  } catch {
    // Online submission still works when browser storage is unavailable.
  }
}

export function getResultIdentity() {
  try {
    const stored = localStorage.getItem(resultIdentityStorageKey());
    const identityId: unknown = stored === null ? null : JSON.parse(stored);
    return typeof identityId === "string" ? identityId : null;
  } catch {
    return null;
  }
}
