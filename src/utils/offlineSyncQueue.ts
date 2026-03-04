/**
 * Offline Sync Queue
 * ─────────────────────────────────────────────────────────
 * Durable IndexedDB-backed queue for API writes that failed
 * or were made while offline. Falls back to localStorage if
 * IndexedDB is unavailable.
 *
 * Entry lifecycle:  pending → in-flight → synced / failed
 * ─────────────────────────────────────────────────────────
 */

const DB_NAME = "tasally-offline";
const DB_VERSION = 2;
const STORE_NAME = "syncQueue";
const LS_FALLBACK_KEY = "tasally:syncQueue";
const MAX_RETRIES = 5;

export interface QueueEntry {
  id: string;
  endpoint: string;
  method: string;
  body: string; // JSON-serialised payload
  headers: Record<string, string>;
  createdAt: string;
  retryCount: number;
  status: "pending" | "in-flight" | "synced" | "failed";
  /** Optional idempotency key the server can use to deduplicate */
  idempotencyKey: string;
}

// ── Helpers ───────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;
let useLocalStorageFallback = false;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    useLocalStorageFallback = true;
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;
      const oldVersion = (event as IDBVersionChangeEvent).oldVersion;

      // v1 → syncQueue
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      }

      // v2 → gameCompletions + syncMeta (created by offlineGameState.ts)
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains("gameCompletions")) {
          const store = db.createObjectStore("gameCompletions", { keyPath: "id" });
          store.createIndex("gameKey", "gameKey", { unique: false });
          store.createIndex("date", "date", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }
        if (!db.objectStoreNames.contains("syncMeta")) {
          db.createObjectStore("syncMeta", { keyPath: "key" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      useLocalStorageFallback = true;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ── localStorage fallback ─────────────────────────────────

function lsRead(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsWrite(entries: QueueEntry[]): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(entries));
  } catch {
    // Storage full — nothing we can do
  }
}

// ── Public API ────────────────────────────────────────────

/**
 * Add an entry to the offline sync queue.
 */
export async function enqueue(
  endpoint: string,
  method: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = { "Content-Type": "application/json" }
): Promise<string> {
  const entry: QueueEntry = {
    id: generateId(),
    endpoint,
    method,
    body: JSON.stringify(body),
    headers,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
    idempotencyKey: generateId(),
  };

  try {
    const db = await openDB();
    await idbPut(db, entry);
  } catch {
    // Fallback to localStorage
    const entries = lsRead();
    entries.push(entry);
    lsWrite(entries);
  }

  notifyListeners();
  return entry.id;
}

/**
 * Get all pending entries (for processing).
 */
export async function getPending(): Promise<QueueEntry[]> {
  try {
    const db = await openDB();
    return idbGetByStatus(db, "pending");
  } catch {
    return lsRead().filter((e) => e.status === "pending");
  }
}

/**
 * Get the count of items waiting to sync.
 */
export async function getQueueSize(): Promise<number> {
  try {
    const db = await openDB();
    const pending = await idbGetByStatus(db, "pending");
    const inflight = await idbGetByStatus(db, "in-flight");
    return pending.length + inflight.length;
  } catch {
    const entries = lsRead();
    return entries.filter(
      (e) => e.status === "pending" || e.status === "in-flight"
    ).length;
  }
}

/**
 * Update an entry's status (and optionally increment retry count).
 */
export async function updateEntry(
  id: string,
  update: Partial<Pick<QueueEntry, "status" | "retryCount">>
): Promise<void> {
  try {
    const db = await openDB();
    const entry = await idbGet(db, id);
    if (!entry) return;
    Object.assign(entry, update);
    await idbPut(db, entry);
  } catch {
    const entries = lsRead();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx >= 0) {
      Object.assign(entries[idx], update);
      lsWrite(entries);
    }
  }
  notifyListeners();
}

/**
 * Remove all synced entries (housekeeping).
 */
export async function clearSynced(): Promise<void> {
  try {
    const db = await openDB();
    const synced = await idbGetByStatus(db, "synced");
    for (const entry of synced) {
      await idbDelete(db, entry.id);
    }
  } catch {
    const entries = lsRead().filter((e) => e.status !== "synced");
    lsWrite(entries);
  }
  notifyListeners();
}

/**
 * Process the queue — attempt to send all pending entries.
 * Returns the number of successfully synced items.
 */
export async function processQueue(): Promise<number> {
  const pending = await getPending();
  if (pending.length === 0) return 0;

  let synced = 0;

  for (const entry of pending) {
    // Mark as in-flight
    await updateEntry(entry.id, { status: "in-flight" });

    try {
      const res = await fetch(entry.endpoint, {
        method: entry.method,
        headers: {
          ...entry.headers,
          "X-Idempotency-Key": entry.idempotencyKey,
        },
        body: entry.body,
      });

      if (res.ok || res.status === 409 /* duplicate */) {
        await updateEntry(entry.id, { status: "synced" });
        synced++;
      } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        // Client error (except rate-limit) — will never succeed, mark failed
        await updateEntry(entry.id, { status: "failed" });
      } else {
        // 5xx or 429 — leave for retry
        const retryCount = entry.retryCount + 1;
        if (retryCount >= MAX_RETRIES) {
          await updateEntry(entry.id, { status: "failed", retryCount });
        } else {
          await updateEntry(entry.id, { status: "pending", retryCount });
        }
      }
    } catch {
      // Network error — put back as pending
      const retryCount = entry.retryCount + 1;
      if (retryCount >= MAX_RETRIES) {
        await updateEntry(entry.id, { status: "failed", retryCount });
      } else {
        await updateEntry(entry.id, { status: "pending", retryCount });
      }
    }
  }

  // Housekeeping — remove synced entries
  await clearSynced();
  notifyListeners();
  return synced;
}

// ── Listener / observer pattern ───────────────────────────

type QueueListener = () => void;
const listeners = new Set<QueueListener>();

export function subscribeQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore listener errors
    }
  });
}

// ── IndexedDB helpers ─────────────────────────────────────

function idbPut(db: IDBDatabase, entry: QueueEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet(db: IDBDatabase, id: string): Promise<QueueEntry | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGetByStatus(
  db: IDBDatabase,
  status: QueueEntry["status"]
): Promise<QueueEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("status");
    const req = index.getAll(status);
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}
