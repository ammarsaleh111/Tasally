#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status > 0) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Production server did not start in time');
}

async function main() {
  const isWin = process.platform === 'win32';
  const server = spawn(
    isWin ? 'npx.cmd' : 'npx',
    ['next', 'start', '-p', String(PORT), '-H', '127.0.0.1'],
    { stdio: 'pipe', shell: isWin }
  );

  let serverLogs = '';
  server.stdout.on('data', (d) => (serverLogs += d.toString()));
  server.stderr.on('data', (d) => (serverLogs += d.toString()));

  try {
    await waitForServer();

    const routes = [
      ['/', 200],
      ['/games', 200],
      ['/games/wordle', 200],
      ['/games/crossword', 200],
      ['/games/numbers', 200],
      ['/games/trivia', 200],
      ['/games/waffle', 200],
      ['/games/combinations', 200],
      ['/games/spelling', 200],
      ['/games/connections', 200],
      ['/games/strands', 200],
      ['/login', 200],
      ['/admin/login', 200],
      ['/groups', 200],
      ['/leaderboard', 200],
      ['/profile', 200],
      ['/this-route-does-not-exist-404', 404],
      ['/robots.txt', 200],
      ['/sitemap.xml', 200],
      ['/sw.js', 200],
      ['/manifest.webmanifest', 200],
    ];

    for (const [route, expectedStatus] of routes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
      assert.equal(
        res.status,
        expectedStatus,
        `Expected ${route} to return ${expectedStatus}, got ${res.status}`
      );
      if (expectedStatus === 200 && route.startsWith('/games/')) {
        const html = await res.text();
        assert.ok(html.includes('<!DOCTYPE html>') || html.includes('<html'), `Invalid HTML on ${route}`);
        // Verify static CSS/JS chunk links in HTML return 200 with proper MIME
        const jsMatches = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].slice(0, 2);
        for (const m of jsMatches) {
          const assetRes = await fetch(`${BASE_URL}${m[1]}`);
          assert.equal(assetRes.status, 200, `Asset ${m[1]} returned ${assetRes.status}`);
          const ct = assetRes.headers.get('content-type') || '';
          assert.ok(ct.includes('javascript'), `Expected JS MIME for ${m[1]}, got ${ct}`);
        }
      }
    }

    // Check /api/crossword/daily for 2026-11-25 (valid) and 2026-08-15 (unavailable 404)
    const cwValid = await fetch(`${BASE_URL}/api/crossword/daily?date=2026-11-25`);
    assert.equal(cwValid.status, 200, `Expected /api/crossword/daily?date=2026-11-25 -> 200, got ${cwValid.status}`);
    const cwMissing = await fetch(`${BASE_URL}/api/crossword/daily?date=2026-08-15`);
    assert.equal(cwMissing.status, 404, `Expected /api/crossword/daily?date=2026-08-15 -> 404, got ${cwMissing.status}`);

    // Check /api/health returns 200 or 503 JSON (never 500 HTML crash)
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.ok([200, 503].includes(healthRes.status), `Unexpected /api/health status ${healthRes.status}`);
    const healthJson = await healthRes.json();
    assert.ok(['healthy', 'unhealthy', 'degraded'].includes(healthJson.status));

    console.log('✅ All production smoke checks passed (21 routes, static JS MIME, crossword API, health API).');
  } finally {
    if (process.platform === 'win32' && server.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Production smoke test failed:', err);
  process.exit(1);
});
