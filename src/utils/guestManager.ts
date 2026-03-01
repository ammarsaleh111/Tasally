/**
 * Guest ID Manager
 * Manages the local guest identifier for unauthenticated users
 */

const GUEST_ID_KEY = "tasally_guest_id";
const LEGACY_GUEST_ID_KEY = "ammar_guest_id";

export function getGuestId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    // Migrate from legacy key
    id = localStorage.getItem(LEGACY_GUEST_ID_KEY);
    if (id) {
      localStorage.setItem(GUEST_ID_KEY, id);
      localStorage.removeItem(LEGACY_GUEST_ID_KEY);
    }
  }
  return id;
}

export function ensureGuestId(): string {
  if (typeof window === "undefined") {
    throw new Error("Cannot generate guest ID on server");
  }
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    // Migrate from legacy key
    id = localStorage.getItem(LEGACY_GUEST_ID_KEY);
    if (id) {
      localStorage.setItem(GUEST_ID_KEY, id);
      localStorage.removeItem(LEGACY_GUEST_ID_KEY);
    }
  }
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function clearGuestId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(LEGACY_GUEST_ID_KEY);
}
