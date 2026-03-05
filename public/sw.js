/**
 * Tasally Service Worker
 * ─────────────────────────────────────────────────────────
 * Strategy:
 *   • Navigation (HTML)  → NetworkFirst  (fresh, fallback to cache)
 *   • Next.js static JS/CSS (_next/static) → CacheFirst (immutable hashed files)
 *   • Next.js RSC payloads (_next/data) → StaleWhileRevalidate
 *   • Images & fonts     → StaleWhileRevalidate
 *   • API POST routes    → Queue for Background Sync on failure
 *   • API GET  (leaderboard, results, groups) → NetworkFirst + stale fallback
 *   • API GET  (other)   → NetworkOnly
 * ─────────────────────────────────────────────────────────
 */

const CACHE_VERSION = 'v4';
const CACHE_HTML    = `at-html-${CACHE_VERSION}`;
const CACHE_STATIC  = `at-static-${CACHE_VERSION}`;
const CACHE_ASSETS  = `at-assets-${CACHE_VERSION}`;
const CACHE_API_RO  = `at-api-ro-${CACHE_VERSION}`; // Read-only API data (leaderboard, etc.)

const SYNC_TAG = 'tasally-offline-sync';

// App-shell pages to pre-cache on install (includes all 9 game routes)
const APP_SHELL = [
  '/',
  '/games',
  '/games/wordle',
  '/games/connections',
  '/games/crossword',
  '/games/numbers',
  '/games/trivia',
  '/games/spelling',
  '/games/strands',
  '/games/waffle',
  '/games/combinations',
];

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_HTML)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const KNOWN = new Set([CACHE_HTML, CACHE_STATIC, CACHE_ASSETS, CACHE_API_RO]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KNOWN.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Helpers ───────────────────────────────────────────────
function isSameOrigin(req) {
  try {
    return new URL(req.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function networkFirst(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((c) => c.put(request, clone));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then(
        (cached) => cached || caches.match('/')
      )
    );
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
    })
  );
}

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) => {
    return cache.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      });
      return cached || fetchPromise;
    });
  });
}

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (!isSameOrigin(request)) return;

  // API routes — handle POSTs for offline sync, cache safe GETs
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'POST') {
      event.respondWith(
        fetch(request.clone()).catch(() => {
          // Network failed — request Background Sync
          return request.clone().text().then((body) => {
            return saveFailedRequest({
              url: request.url,
              method: request.method,
              headers: Object.fromEntries(request.headers.entries()),
              body: body,
            }).then(() => {
              return self.registration.sync.register(SYNC_TAG).catch(() => {});
            }).then(() => {
              // Return a synthetic 202 so the client knows it was queued
              return new Response(JSON.stringify({ queued: true }), {
                status: 202,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          });
        })
      );
      return;
    }

    // Cacheable read-only API GETs (leaderboard, results, profile)
    const CACHEABLE_API = ['/api/leaderboard', '/api/results', '/api/groups'];
    if (request.method === 'GET' && CACHEABLE_API.some((p) => url.pathname.startsWith(p))) {
      event.respondWith(
        fetch(request.clone())
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_API_RO).then((c) => c.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline — serve cached version with stale header
            return caches.match(request).then((cached) => {
              if (cached) {
                // Clone and add stale indicator header
                const headers = new Headers(cached.headers);
                headers.set('X-Tasally-Stale', '1');
                return new Response(cached.body, {
                  status: cached.status,
                  statusText: cached.statusText,
                  headers,
                });
              }
              return new Response(JSON.stringify({ error: 'offline', stale: true }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          })
      );
      return;
    }

    // Other API GET requests — pass through (NetworkOnly)
    return;
  }

  // Next.js RSC payloads (puzzle data carried in React Server Components)
  // These look like /_next/data/... or carry RSC headers
  if (url.pathname.startsWith('/_next/data/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // Next.js immutable static bundles → CacheFirst
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Image & font assets → StaleWhileRevalidate
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/themes/')
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_ASSETS));
    return;
  }

  // HTML navigation → NetworkFirst
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_HTML));
    return;
  }
});

// ── Background Sync ───────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayFailedRequests());
  }
});

// Notify all clients when back online so they can refresh counts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    self.registration.sync.register(SYNC_TAG).catch(() => {});
  }

  // Force clear all caches (called when client detects ChunkLoadError)
  if (event.data && event.data.type === 'FORCE_CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => 
        Promise.all(keys.map((k) => caches.delete(k)))
      ).then(() => {
        // Notify all clients to reload
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHES_CLEARED' });
          });
        });
      })
    );
  }

  // Warm game page caches proactively (called from client after install)
  if (event.data && event.data.type === 'WARM_GAME_CACHES') {
    event.waitUntil(
      caches.open(CACHE_HTML).then((cache) => {
        return Promise.allSettled(
          APP_SHELL.map((url) =>
            cache.match(url).then((existing) => {
              if (!existing) {
                return fetch(url).then((resp) => {
                  if (resp && resp.ok) cache.put(url, resp);
                });
              }
            })
          )
        );
      })
    );
  }
});

// ── SW IndexedDB queue for failed requests ────────────────
const SW_DB_NAME = 'tasally-sw-sync';
const SW_DB_VERSION = 1;
const SW_STORE = 'failedRequests';

function openSWDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SW_DB_NAME, SW_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SW_STORE)) {
        db.createObjectStore(SW_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveFailedRequest(data) {
  return openSWDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SW_STORE, 'readwrite');
      tx.objectStore(SW_STORE).add({ ...data, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function replayFailedRequests() {
  return openSWDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SW_STORE, 'readonly');
      const req = tx.objectStore(SW_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }).then((entries) => {
    return Promise.all(
      entries.map((entry) =>
        fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        })
          .then((res) => {
            if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
              // Succeeded or permanently failed — remove from queue
              return deleteFailedRequest(entry.id);
            }
            // 5xx or 429 — leave for next sync attempt
          })
          .catch(() => {
            // Still offline — leave for next sync
          })
      )
    );
  });
}

function deleteFailedRequest(id) {
  return openSWDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SW_STORE, 'readwrite');
      tx.objectStore(SW_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}
