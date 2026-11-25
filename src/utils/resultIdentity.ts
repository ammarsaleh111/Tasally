import { getUserStorageKey } from "./storageKeys";

export const RESULT_IDENTITY_HEADER = "X-Tasally-Identity";

export function isResultEndpoint(endpoint: string) {
  return endpoint === "/api/results" || endpoint === "/api/games/global/results"
    || /^\/api\/groups\/[^/]+\/results$/.test(endpoint);
}

export function resultIdentityStorageKey() {
  return getUserStorageKey("resultIdentity");
}

export function storeResultIdentity(key: string, identityId: string | null) {
  try {
    if (key !== resultIdentityStorageKey()) return;
    if (identityId) localStorage.setItem(key, identityId);
    else localStorage.removeItem(key);
  } catch {
    // Online submission still works when browser storage is unavailable.
  }
}

export function getResultIdentity() {
  try {
    return localStorage.getItem(resultIdentityStorageKey());
  } catch {
    return null;
  }
}
