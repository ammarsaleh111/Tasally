/**
 * Offline Game State Manager
 * ─────────────────────────────────────────────────────────
 * Tracks game completions locally in IndexedDB so that:
 *   1. Stats update instantly (no server round-trip)
 *   2. Streaks survive multi-day offline sessions
 *   3. Duplicate submissions are caught on sync
 *
 * Store: IndexedDB "tasally-offline" → "gameCompletions"
 * ─────────────────────────────────────────────────────────
 */

const DB_NAME = "tasally-offline";
const DB_VERSION = 2; // Bumped from v1 (syncQueue only) → v2 (+ gameCompletions)
const COMPLETIONS_STORE = "gameCompletions";
const SYNC_META_STORE = "syncMeta";

export interface GameCompletion {
  /** Composite key: `${gameKey}:${date}` */
  id: string;
  gameKey: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  completed: boolean;
  success: boolean;
  attempts?: number;
  durationMs?: number;
  score?: number;
  metadata?: Record<string, unknown>;
  /** When this completion was recorded locally */
  recordedAt: string;
  /** Whether this has been confirmed synced to server */
  synced: boolean;
}

export interface SyncMeta {
  key: string;
  value: string;
}

// ── DB open ───────────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // v1 → syncQueue (already created by offlineSyncQueue.ts)
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains("syncQueue")) {
          const store = db.createObjectStore("syncQueue", { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      }

      // v2 → gameCompletions + syncMeta
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(COMPLETIONS_STORE)) {
          const store = db.createObjectStore(COMPLETIONS_STORE, { keyPath: "id" });
          store.createIndex("gameKey", "gameKey", { unique: false });
          store.createIndex("date", "date", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }
        if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
          db.createObjectStore(SYNC_META_STORE, { keyPath: "key" });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

// ── Completions API ───────────────────────────────────────

/**
 * Record a game completion locally.
 * Uses `gameKey:date` as a composite key so daily games are idempotent.
 */
export async function recordCompletion(
  gameKey: string,
  date: string,
  result: {
    success: boolean;
    attempts?: number;
    durationMs?: number;
    score?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<GameCompletion> {
  const completion: GameCompletion = {
    id: `${gameKey}:${date}`,
    gameKey,
    date,
    completed: true,
    success: result.success,
    attempts: result.attempts,
    durationMs: result.durationMs,
    score: result.score,
    metadata: result.metadata,
    recordedAt: new Date().toISOString(),
    synced: false,
  };

  try {
    const db = await openDB();
    await idbPut(db, COMPLETIONS_STORE, completion);
  } catch {
    // Fallback: save in localStorage
    lsSaveCompletion(completion);
  }

  return completion;
}

/**
 * Check if a game was already completed on a given date (locally).
 */
export async function isCompletedLocally(gameKey: string, date: string): Promise<boolean> {
  try {
    const db = await openDB();
    const entry = await idbGet(db, COMPLETIONS_STORE, `${gameKey}:${date}`);
    return !!entry?.completed;
  } catch {
    return lsHasCompletion(gameKey, date);
  }
}

/**
 * Get all unsynced completions.
 */
export async function getUnsyncedCompletions(): Promise<GameCompletion[]> {
  try {
    const db = await openDB();
    return idbGetByIndex(db, COMPLETIONS_STORE, "synced", false);
  } catch {
    return lsGetUnsynced();
  }
}

/**
 * Mark a completion as synced.
 */
export async function markSynced(id: string): Promise<void> {
  try {
    const db = await openDB();
    const entry = await idbGet(db, COMPLETIONS_STORE, id);
    if (entry) {
      entry.synced = true;
      await idbPut(db, COMPLETIONS_STORE, entry);
    }
  } catch {
    lsMarkSynced(id);
  }
}

/**
 * Get all completions for a specific game (for stats reconstruction).
 */
export async function getCompletionsForGame(gameKey: string): Promise<GameCompletion[]> {
  try {
    const db = await openDB();
    return idbGetByIndex(db, COMPLETIONS_STORE, "gameKey", gameKey);
  } catch {
    return lsGetByGame(gameKey);
  }
}

/**
 * Get all completions across all games (sorted by date desc).
 */
export async function getAllCompletions(): Promise<GameCompletion[]> {
  try {
    const db = await openDB();
    return idbGetAll(db, COMPLETIONS_STORE);
  } catch {
    return lsGetAll();
  }
}

/**
 * Reconstruct the current streak from local completions.
 * Walks backwards from today counting consecutive days with a win.
 */
export async function reconstructStreak(gameKey: string): Promise<number> {
  const completions = await getCompletionsForGame(gameKey);

  // Build a Set of winning dates
  const winDates = new Set<string>();
  for (const c of completions) {
    if (c.success) winDates.add(c.date);
  }

  if (winDates.size === 0) return 0;

  // Walk backwards from today
  let streak = 0;
  const d = new Date();
  // Start from today in UTC
  d.setUTCHours(0, 0, 0, 0);

  // Check today first — if not played today, check if played yesterday
  const todayKey = dateToKey(d);
  if (!winDates.has(todayKey)) {
    d.setUTCDate(d.getUTCDate() - 1);
    const yesterdayKey = dateToKey(d);
    if (!winDates.has(yesterdayKey)) return 0;
  }

  while (true) {
    const key = dateToKey(d);
    if (winDates.has(key)) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ── Sync Metadata ─────────────────────────────────────────

export async function getSyncMeta(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    const entry = await idbGet(db, SYNC_META_STORE, key);
    return entry?.value ?? null;
  } catch {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(`tasally:syncMeta:${key}`)
      : null;
  }
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    await idbPut(db, SYNC_META_STORE, { key, value });
  } catch {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`tasally:syncMeta:${key}`, value);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────

function dateToKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// ── IndexedDB primitives ──────────────────────────────────

function idbPut(db: IDBDatabase, storeName: string, entry: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet(db: IDBDatabase, storeName: string, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

function idbGetByIndex(db: IDBDatabase, storeName: string, indexName: string, value: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const index = tx.objectStore(storeName).index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

// ── localStorage fallback ─────────────────────────────────

const LS_KEY = "tasally:gameCompletions";

function lsRead(): GameCompletion[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsWrite(entries: GameCompletion[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // storage full
  }
}

function lsSaveCompletion(c: GameCompletion): void {
  const entries = lsRead();
  const idx = entries.findIndex((e) => e.id === c.id);
  if (idx >= 0) {
    entries[idx] = c;
  } else {
    entries.push(c);
  }
  lsWrite(entries);
}

function lsHasCompletion(gameKey: string, date: string): boolean {
  return lsRead().some((c) => c.gameKey === gameKey && c.date === date && c.completed);
}

function lsGetUnsynced(): GameCompletion[] {
  return lsRead().filter((c) => !c.synced);
}

function lsMarkSynced(id: string): void {
  const entries = lsRead();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx >= 0) {
    entries[idx].synced = true;
    lsWrite(entries);
  }
}

function lsGetByGame(gameKey: string): GameCompletion[] {
  return lsRead().filter((c) => c.gameKey === gameKey);
}

function lsGetAll(): GameCompletion[] {
  return lsRead();
}
