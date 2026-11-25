#!/usr/bin/env tsx

/**
 * API Smoke Test Script
 * 
 * Runs basic smoke tests against all API endpoints to verify:
 * - Happy path works
 * - Error responses are consistent
 * - HTTP status codes are correct
 * 
 * Usage:
 *   npm run test:api
 *   npm run test:api -- --endpoint=/api/health
 *   npm run test:api -- --verbose
 */

import assert from 'node:assert/strict';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

interface TestResult {
  name: string;
  method: string;
  path: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  statusCode?: number;
  expectedStatus?: number;
}

const results: TestResult[] = [];

function log(message: string, verbose = false) {
  if (verbose || process.argv.includes('--verbose')) {
    console.log(message);
  }
}

function pass(name: string, method: string, path: string, statusCode: number) {
  results.push({ name, method, path, status: 'PASS', statusCode });
  log(`✓ ${name}`, true);
}

function fail(name: string, method: string, path: string, error: string, statusCode?: number, expectedStatus?: number) {
  results.push({ name, method, path, status: 'FAIL', error, statusCode, expectedStatus });
  console.error(`✗ ${name}: ${error}`);
}

function skip(name: string, method: string, path: string) {
  results.push({ name, method, path, status: 'SKIP' });
  log(`○ ${name} (skipped)`, true);
}

async function apiCall(method: string, path: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Ignore parse errors for non-JSON responses
  }

  return { response, data };
}

// ===========================
// Test Suite
// ===========================

async function testHealth() {
  const { response, data } = await apiCall('GET', '/api/health');
  
  if (response.status === 200 && data.status) {
    pass('Health Check', 'GET', '/api/health', response.status);
  } else {
    fail('Health Check', 'GET', '/api/health', `Expected 200, got ${response.status}`, response.status, 200);
  }
}

async function testAnonymousPlayers() {
  const path = '/api/identity/me';
  const create = () => apiCall('POST', path);
  const visitors = await Promise.all([create(), create()]);
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const { response, data } of visitors) {
    assert.equal(response.status, 200);
    const player = data.data.identity;
    assert.match(player.displayName, /^anonymous[1-9]\d*$/);
    ids.add(player.id);
    names.add(player.displayName);
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);
    for (const method of ['POST', 'GET']) {
      const reload = await apiCall(method, path, { headers: { Cookie: cookie } });
      assert.equal(reload.data.data.identity.id, player.id);
      assert.equal(reload.data.data.identity.displayName, player.displayName);
    }
  }
  assert.equal(ids.size, 2);
  assert.equal(names.size, 2);
  pass('Concurrent anonymous visitors and returning players', 'POST', path, 200);
}

async function testThemeSettings() {
  const { response, data } = await apiCall('GET', '/api/theme/settings');
  
  if (response.status === 200 && typeof data === 'object') {
    pass('Theme Settings', 'GET', '/api/theme/settings', response.status);
  } else {
    fail('Theme Settings', 'GET', '/api/theme/settings', `Expected 200, got ${response.status}`, response.status, 200);
  }
}

async function testWordValidation() {
  const { response, data } = await apiCall('POST', '/api/word-validation', {
    body: JSON.stringify({ word: 'crane' }),
  });
  
  if (response.status === 200 && data.valid !== undefined) {
    pass('Word Validation', 'POST', '/api/word-validation', response.status);
  } else {
    fail('Word Validation', 'POST', '/api/word-validation', `Expected 200, got ${response.status}`, response.status, 200);
  }
}

async function testWordValidation_Invalid() {
  const { response, data } = await apiCall('POST', '/api/word-validation', {
    body: JSON.stringify({ word: '' }), // Invalid empty word
  });
  
  if (response.status === 400) {
    pass('Word Validation (Invalid Input)', 'POST', '/api/word-validation', response.status);
  } else {
    fail('Word Validation (Invalid Input)', 'POST', '/api/word-validation', `Expected 400, got ${response.status}`, response.status, 400);
  }
}

async function testOnlineCount() {
  const { response, data } = await apiCall('GET', '/api/presence/online-count');
  
  if (response.status === 200 && typeof data.onlineCount === 'number') {
    pass('Online Count', 'GET', '/api/presence/online-count', response.status);
  } else {
    fail('Online Count', 'GET', '/api/presence/online-count', `Expected 200, got ${response.status}`, response.status, 200);
  }
}

async function testRegister_MissingEmail() {
  const { response } = await apiCall('POST', '/api/auth/register', {
    body: JSON.stringify({ password: 'password123' }), // Missing email
  });
  
  if (response.status === 400) {
    pass('Register (Missing Email)', 'POST', '/api/auth/register', response.status);
  } else {
    fail('Register (Missing Email)', 'POST', '/api/auth/register', `Expected 400, got ${response.status}`, response.status, 400);
  }
}

async function testResults_Unauthorized() {
  const { response } = await apiCall('POST', '/api/results', {
    body: JSON.stringify({
      gameKey: 'wordle',
      mode: 'daily',
      success: true,
    }),
  });
  
  // Should fail with 400 (missing guestId) or 401 (no session)
  if (response.status === 400 || response.status === 401) {
    pass('Submit Result (Unauthorized)', 'POST', '/api/results', response.status);
  } else {
    fail('Submit Result (Unauthorized)', 'POST', '/api/results', `Expected 400 or 401, got ${response.status}`, response.status, 401);
  }
}

async function testLeaderboard_Unauthorized() {
  const { response } = await apiCall('GET', '/api/leaderboard/daily?game=wordle');
  
  if (response.status === 401) {
    pass('Leaderboard (Unauthorized)', 'GET', '/api/leaderboard/daily', response.status);
  } else {
    fail('Leaderboard (Unauthorized)', 'GET', '/api/leaderboard/daily', `Expected 401, got ${response.status}`, response.status, 401);
  }
}

async function testAdminLogin_InvalidCredentials() {
  const { response } = await apiCall('POST', '/api/admin/login', {
    body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
  });
  
  if (response.status === 401 || response.status === 400) {
    pass('Admin Login (Invalid Credentials)', 'POST', '/api/admin/login', response.status);
  } else {
    fail('Admin Login (Invalid Credentials)', 'POST', '/api/admin/login', `Expected 401, got ${response.status}`, response.status, 401);
  }
}

async function testAdminMetrics_Unauthorized() {
  const { response } = await apiCall('GET', '/api/admin/metrics');
  
  if (response.status === 401) {
    pass('Admin Metrics (Unauthorized)', 'GET', '/api/admin/metrics', response.status);
  } else {
    fail('Admin Metrics (Unauthorized)', 'GET', '/api/admin/metrics', `Expected 401, got ${response.status}`, response.status, 401);
  }
}

async function testLegacyPlayerDelete_Unauthorized() {
  const { response } = await apiCall('DELETE', '/api/players');
  if (response.status === 401) {
    pass('Legacy Player Delete (Unauthorized)', 'DELETE', '/api/players', 401);
  } else {
    fail('Legacy Player Delete (Unauthorized)', 'DELETE', '/api/players', `Expected 401, got ${response.status}`, response.status, 401);
  }
}

// ===========================
// Main Test Runner
// ===========================

async function runTests() {
  console.log('🚀 Starting API Smoke Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const filterEndpoint = process.argv.find(arg => arg.startsWith('--endpoint='))?.split('=')[1];

  const tests = [
    { name: 'Anonymous players', fn: testAnonymousPlayers, path: '/api/identity/me' },
    { name: 'Health', fn: testHealth, path: '/api/health' },
    { name: 'Theme Settings', fn: testThemeSettings, path: '/api/theme/settings' },
    { name: 'Word Validation', fn: testWordValidation, path: '/api/word-validation' },
    { name: 'Word Validation (Invalid)', fn: testWordValidation_Invalid, path: '/api/word-validation' },
    { name: 'Online Count', fn: testOnlineCount, path: '/api/presence/online-count' },
    { name: 'Register (Missing Email)', fn: testRegister_MissingEmail, path: '/api/auth/register' },
    { name: 'Results (Unauthorized)', fn: testResults_Unauthorized, path: '/api/results' },
    { name: 'Leaderboard (Unauthorized)', fn: testLeaderboard_Unauthorized, path: '/api/leaderboard/daily' },
    { name: 'Admin Login (Invalid)', fn: testAdminLogin_InvalidCredentials, path: '/api/admin/login' },
    { name: 'Admin Metrics (Unauthorized)', fn: testAdminMetrics_Unauthorized, path: '/api/admin/metrics' },
    { name: 'Legacy Player Delete (Unauthorized)', fn: testLegacyPlayerDelete_Unauthorized, path: '/api/players' },
  ];

  for (const test of tests) {
    if (filterEndpoint && !test.path.includes(filterEndpoint)) {
      skip(test.name, 'N/A', test.path);
      continue;
    }

    try {
      await test.fn();
    } catch (error) {
      fail(test.name, 'N/A', test.path, error instanceof Error ? error.message : String(error));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`✓ Passed: ${passed}/${total - skipped}`);
  console.log(`✗ Failed: ${failed}/${total - skipped}`);
  if (skipped > 0) {
    console.log(`○ Skipped: ${skipped}/${total}`);
  }

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name} (${r.method} ${r.path})`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
