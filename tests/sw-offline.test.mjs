import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
