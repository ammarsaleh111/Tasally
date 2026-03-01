/**
 * Tasally Service Worker
 * ─────────────────────────────────────────────────────────
 * Strategy:
 *   • Navigation (HTML)  → NetworkFirst  (fresh, fallback to cache)
 *   • Next.js static JS/CSS (_next/static) → CacheFirst (immutable hashed files)
 *   • Images & fonts     → StaleWhileRevalidate
 *   • API routes         → NetworkOnly  (never cache)
 * ─────────────────────────────────────────────────────────
 */

const CACHE_VERSION = 'v1';
const CACHE_HTML    = `at-html-${CACHE_VERSION}`;
const CACHE_STATIC  = `at-static-${CACHE_VERSION}`;
const CACHE_ASSETS  = `at-assets-${CACHE_VERSION}`;

// App-shell pages to pre-cache on install
const APP_SHELL = ['/', '/games'];

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
  const KNOWN = new Set([CACHE_HTML, CACHE_STATIC, CACHE_ASSETS]);
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

  // Never cache API routes
  if (url.pathname.startsWith('/api/')) return;

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
