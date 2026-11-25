/**
 * Tasally Service Worker
 *
 * Safe offline model:
 * - Navigation requests use NetworkFirst and fall back only to the exact
 *   cached page or a static offline document.
 * - Next.js build assets never receive HTML/text fallbacks.
 * - Runtime caches are scoped per build so stale deployments are discarded
 *   when the new worker activates.
 * - The worker does not use skipWaiting() or clients.claim(), which avoids
 *   taking over open tabs that still depend on older chunk hashes.
 */

const WORKER_URL = new URL(self.location.href);
const BUILD_VERSION = WORKER_URL.searchParams.get('v') || 'dev';
const CACHE_PREFIX = 'tasally';
const CACHE_NAVIGATION = `${CACHE_PREFIX}-pages-${BUILD_VERSION}`;
const CACHE_RUNTIME = `${CACHE_PREFIX}-runtime-${BUILD_VERSION}`;
const CACHE_ASSETS = `${CACHE_PREFIX}-assets-${BUILD_VERSION}`;
const CACHE_API = `${CACHE_PREFIX}-api-${BUILD_VERSION}`;
const OFFLINE_DOCUMENT = '/offline.html';
const SYNC_TAG = 'tasally-offline-sync';
const KNOWN_CACHES = new Set([
  CACHE_NAVIGATION,
  CACHE_RUNTIME,
  CACHE_ASSETS,
  CACHE_API,
]);

const NAVIGATION_CACHE_ALLOWLIST = [
  /^\/$/,
  /^\/games(?:\/[^/?#]+)?$/,
  /^\/daily-puzzle-games$/,
  /^\/puzzle-games$/,
  /^\/word-games$/,
  /^\/tasally-games$/,
  /^\/themes$/,
  /^\/faq$/,
  /^\/how-to-play$/,
  /^\/what-is-tasally$/,
  /^\/about-tasally$/,
  /^\/تسالي$/,
  /^\/العاب-تسالي$/,
  /^\/العاب-ذكاء-يومية$/,
  /^\/الأسئلة-الشائعة$/,
];

const CACHEABLE_API_PREFIXES = [
  '/api/crossword/daily',
  '/api/presence/online-count',
];

const QUEUEABLE_API_PATTERNS = [
  /^\/api\/results$/,
  /^\/api\/games\/global\/results$/,
  /^\/api\/crossword\/progress$/,
  /^\/api\/groups\/[^/]+\/results$/,
];

const MAX_QUEUE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

self.addEventListener('install', (event) => {
  event.waitUntil(precacheCore());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupOldCaches());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!isSameOrigin(request)) {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'POST' && isQueueableApiPost(url) && request.headers.has('x-tasally-identity')) {
      event.respondWith(handleApiPost(request));
      return;
    }

    if (request.method === 'GET' && isCacheableApiRequest(url)) {
      event.respondWith(networkFirstApi(request));
    }
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname === OFFLINE_DOCUMENT) {
    event.respondWith(cacheFirst(request, CACHE_NAVIGATION));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
    return;
  }

  if (isRscRequest(request, url)) {
    if (isCacheablePage(url)) event.respondWith(networkFirstAsset(request, CACHE_RUNTIME));
    return;
  }

  if (isCacheableStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_ASSETS));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request, url, event));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayFailedRequests());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    event.waitUntil(registerSync());
    return;
  }

  if (event.data && event.data.type === 'FORCE_CLEAR_CACHES') {
    event.waitUntil(
      clearTasallyCaches().then(() =>
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHES_CLEARED' });
          });
        })
      )
    );
  }
});

async function precacheCore() {
  const cache = await caches.open(CACHE_NAVIGATION);
  await cache.addAll([
    OFFLINE_DOCUMENT,
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/maskable-192.png',
    '/icons/maskable-512.png',
  ]);
}

async function cleanupOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && !KNOWN_CACHES.has(key))
      .map((key) => caches.delete(key))
  );
}

async function clearTasallyCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) || key.startsWith('at-'))
      .map((key) => caches.delete(key))
  );
}

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isCacheablePage(url) {
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/login')) {
    return false;
  }

  if (url.pathname.startsWith('/profile') || url.pathname.startsWith('/groups')) {
    return false;
  }

  return NAVIGATION_CACHE_ALLOWLIST.some((pattern) => pattern.test(url.pathname));
}

function isCacheableApiRequest(url) {
  return CACHEABLE_API_PREFIXES.includes(url.pathname);
}

function isQueueableApiPost(url) {
  return QUEUEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

function isRscRequest(request, url) {
  const accept = request.headers.get('accept') || '';
  return (
    url.pathname.startsWith('/_next/data/') ||
    url.searchParams.has('_rsc') ||
    request.headers.has('rsc') ||
    accept.includes('text/x-component')
  );
}

function isCacheableStaticAsset(request, url) {
  return (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/themes/')
  );
}

function isCacheableResponse(response) {
  return Boolean(response && response.ok && !response.headers.get('set-cookie') && !/\b(?:private|no-store)\b/i.test(response.headers.get('cache-control') || ''));
}

async function putInCache(cacheName, request, response) {
  if (!isCacheableResponse(response)) {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await putInCache(cacheName, request, response);
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response);
      return response;
    })
    .catch(() => null);

  if (cached) {
    void fetchPromise;
    return cached;
  }

  const response = await fetchPromise;
  return response || Response.error();
}

async function networkFirstAsset(request, cacheName) {
  try {
    const response = await fetch(request);
    await putInCache(cacheName, request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function networkFirstNavigation(request, url, event) {
  const cacheable = isCacheablePage(url);
  const fresh = fetch(request).then(async response => {
    if (cacheable && isHtmlResponse(response)) {
      await putInCache(CACHE_NAVIGATION, request, response);
    }
    return response;
  }).catch(() => null);

  // Keep refreshing in the background when a previously visited public page
  // can open from this build's cache on a slow connection.
  event.waitUntil(fresh.then(() => undefined));
  const cached = cacheable ? await (await caches.open(CACHE_NAVIGATION)).match(request) : null;
  if (cached) {
    let timer;
    try {
      const deadline = new Promise(resolve => { timer = setTimeout(() => resolve(null), 3000); });
      const response = await Promise.race([fresh, deadline]);
      return response && response.status < 500 ? response : cached;
    } finally {
      clearTimeout(timer);
    }
  }

  return await fresh || await caches.match(OFFLINE_DOCUMENT)
    || new Response('Offline', { status: 503, statusText: 'Offline' });
}

function isHtmlResponse(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
}

async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    await putInCache(CACHE_API, request, response);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
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
  }
}

async function handleApiPost(request) {
  try {
    return await fetch(request.clone());
  } catch {
    const body = await request.clone().text();
    await saveFailedRequest({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    });
    await registerSync();

    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function registerSync() {
  if (!self.registration.sync) {
    return Promise.resolve();
  }

  return self.registration.sync.register(SYNC_TAG).catch(() => {});
}

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
      const store = tx.objectStore(SW_STORE);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const existing = getAllReq.result || [];
        const duplicate = existing.find(
          (item) => item.url === data.url && item.method === data.method && item.body === data.body
            && item.headers?.['x-tasally-identity'] === data.headers['x-tasally-identity']
        );
        if (!duplicate) {
          store.add({ ...data, timestamp: Date.now() });
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

async function replayFailedRequests() {
  const db = await openSWDB();
  const entries = await new Promise((resolve, reject) => {
    const tx = db.transaction(SW_STORE, 'readonly');
    const req = tx.objectStore(SW_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (entries.length === 0) return;

  const now = Date.now();
  let currentIdentityId = null;
  try {
    const meRes = await fetch('/api/identity/me', { cache: 'no-store', credentials: 'same-origin' });
    if (meRes.ok) {
      const meJson = await meRes.json();
      currentIdentityId = meJson?.data?.identity?.id || null;
    }
  } catch {
    // Still offline or unreachable; keep entries for next sync
    return;
  }

  for (const entry of entries) {
    // Drop expired entries
    if (entry.timestamp && now - entry.timestamp > MAX_QUEUE_AGE_MS) {
      await deleteFailedRequest(entry.id);
      continue;
    }

    // Keep requests for another identity until that identity becomes active.
    // Entries from older workers without an owner expire without being sent.
    const queuedIdentityId = entry.headers?.['x-tasally-identity'] || entry.headers?.['X-Tasally-Identity'] || null;
    if (!queuedIdentityId || queuedIdentityId !== currentIdentityId) continue;

    try {
      const res = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
        credentials: 'same-origin',
      });
      if (res.ok || (res.status >= 400 && res.status < 500 && ![401, 403, 429].includes(res.status))) {
        await deleteFailedRequest(entry.id);
      }
    } catch {
      // Network error; leave in queue for next sync
    }
  }
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
