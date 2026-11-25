import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const swSource = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('Service Worker restricts offline POST queueing to safe game/progress endpoints', () => {
  assert.match(swSource, /QUEUEABLE_API_PATTERNS/);
  assert.match(swSource, /isQueueableApiPost/);
  // Must not queue all /api/ POSTs unconditionally
  assert.doesNotMatch(swSource, /if \(request\.method === 'POST'\) \{\s*event\.respondWith\(handleApiPost/);
  // Must include identity check & max age in replayFailedRequests
  assert.match(swSource, /MAX_QUEUE_AGE_MS/);
  assert.match(swSource, /\/api\/identity\/me/);
  assert.match(swSource, /credentials:\s*'same-origin'/);
});

test('Service Worker replays only requests owned by the active identity', async () => {
  const activeIdentity = 'current-player';
  const endpoint = 'https://example.test/api/results';
  const entries = [
    { id: 1, url: endpoint, headers: {} },
    { id: 2, url: endpoint, headers: { 'x-tasally-identity': 'other-player' } },
    { id: 3, url: endpoint, headers: { 'x-tasally-identity': activeIdentity } },
  ];
  const sent = [];
  const deleted = [];
  let currentIdentity = null;
  const context = vm.createContext({
    URL,
    self: { location: { href: 'https://example.test/sw.js' }, addEventListener() {} },
    fetch: async (url, options) => {
      if (url === '/api/identity/me') {
        return { ok: true, json: async () => ({ data: { identity: currentIdentity } }) };
      }
      sent.push(options.headers['x-tasally-identity']);
      return { ok: true };
    },
  });
  vm.runInContext(swSource, context);
  context.openSWDB = async () => ({
    transaction: () => ({
      objectStore: () => ({
        getAll() {
          const request = { result: entries };
          queueMicrotask(() => request.onsuccess());
          return request;
        },
      }),
    }),
  });
  context.deleteFailedRequest = async (id) => deleted.push(id);

  await context.replayFailedRequests();
  assert.deepEqual(sent, []);
  assert.deepEqual(deleted, []);
  currentIdentity = { id: activeIdentity };
  await context.replayFailedRequests();
  assert.deepEqual(sent, [activeIdentity]);
  assert.deepEqual(deleted, [3]);
});

test('a stalled navigation uses its own cached public page and keeps the refresh alive', async () => {
  const url = new URL('https://example.test/games');
  const cached = new Response('public games');
  let finishFetch;
  let background;
  const context = vm.createContext({
    URL, Response,
    self: { location: { href: 'https://example.test/sw.js?v=new' }, addEventListener() {} },
    fetch: () => new Promise(resolve => { finishFetch = resolve; }),
    caches: { open: async name => {
      assert.equal(name, 'tasally-pages-new');
      return { match: async request => request === url ? cached : null };
    } },
    setTimeout: callback => setTimeout(callback, 0),
    clearTimeout,
  });
  vm.runInContext(swSource, context);
  const response = await context.networkFirstNavigation(url, url, { waitUntil(promise) { background = promise; } });
  assert.equal(response, cached);
  finishFetch(new Response(null, { status: 204 }));
  await background;
});
