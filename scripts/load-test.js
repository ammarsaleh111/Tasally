/**
 * Load Test Script for Ammar Times
 * 
 * Uses k6 for load testing (https://k6.io)
 * 
 * Install k6:
 *   - Windows: choco install k6
 *   - Mac: brew install k6
 *   - Linux: snap install k6
 * 
 * Run tests:
 *   k6 run scripts/load-test.js
 *   k6 run --vus 50 --duration 2m scripts/load-test.js
 *   k6 run --vus 200 --duration 5m scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { randomString, uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const rateLimitedRequests = new Counter('rate_limited');
const heartbeatDuration = new Trend('heartbeat_duration', true);
const leaderboardDuration = new Trend('leaderboard_duration', true);
const resultsDuration = new Trend('results_duration', true);

// Test configuration
export const options = {
  scenarios: {
    // Normal load: 50 concurrent users
    normal_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      exec: 'normalUser',
      tags: { scenario: 'normal' },
    },
    // Stress test: 200 concurrent users
    // stress_load: {
    //   executor: 'constant-vus',
    //   vus: 200,
    //   duration: '5m',
    //   exec: 'normalUser',
    //   startTime: '2m30s',
    //   tags: { scenario: 'stress' },
    // },
  },
  thresholds: {
    // Error rate must be below 1%
    'errors': ['rate<0.01'],
    // p95 latency for cached reads under 500ms
    'leaderboard_duration': ['p(95)<500'],
    // p95 latency for heartbeat under 300ms
    'heartbeat_duration': ['p(95)<300'],
    // HTTP failures under 1%
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Session data per VU
const vuData = {
  sessionId: null,
  guestId: null,
};

export function setup() {
  console.log(`Load testing ${BASE_URL}`);
  console.log('Testing endpoints: /api/realtime/heartbeat, /api/leaderboard/daily, /api/results');
  return { startTime: Date.now() };
}

/**
 * Simulates a normal user browsing the site
 * - Sends heartbeat every 20-30 seconds
 * - Refreshes leaderboard every 30 seconds
 * - Occasionally submits a game result
 */
export function normalUser() {
  // Initialize session data for this VU
  if (!vuData.sessionId) {
    vuData.sessionId = `session_${Date.now()}_${randomString(8)}`;
    vuData.guestId = uuidv4();
  }

  group('heartbeat', () => {
    const payload = JSON.stringify({
      sessionId: vuData.sessionId,
      playerName: `LoadTest_${__VU}`,
      currentGame: 'wordle',
      currentPage: '/games/wordle',
      userId: vuData.guestId,
      role: 'GUEST',
      state: 'PLAYING',
      timestamp: Date.now(),
      userAgent: 'k6-load-test',
    });

    const res = http.post(`${BASE_URL}/api/realtime/heartbeat`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'heartbeat' },
    });

    heartbeatDuration.add(res.timings.duration);
    
    const success = check(res, {
      'heartbeat status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    });

    if (res.status === 429) {
      rateLimitedRequests.add(1);
    }
    
    errorRate.add(!success);
  });

  sleep(randomIntBetween(5, 10));

  group('leaderboard', () => {
    const res = http.get(`${BASE_URL}/api/leaderboard/daily?game=wordle`, {
      tags: { name: 'leaderboard' },
    });

    leaderboardDuration.add(res.timings.duration);
    
    const success = check(res, {
      'leaderboard status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
    
    errorRate.add(!success);
  });

  sleep(randomIntBetween(10, 20));

  // Occasionally submit a result (10% chance)
  if (Math.random() < 0.1) {
    group('submit_result', () => {
      const payload = JSON.stringify({
        gameKey: 'wordle',
        mode: 'practice', // Use practice mode to avoid daily unique constraint
        success: Math.random() > 0.3,
        attempts: randomIntBetween(1, 6),
        durationMs: randomIntBetween(30000, 300000),
        guestId: vuData.guestId,
        displayName: `LoadTest_${__VU}`,
      });

      const res = http.post(`${BASE_URL}/api/results`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'results' },
      });

      resultsDuration.add(res.timings.duration);
      
      const success = check(res, {
        'results status is 200 or 429': (r) => r.status === 200 || r.status === 429,
      });

      if (res.status === 429) {
        rateLimitedRequests.add(1);
      }
      
      errorRate.add(!success);
    });
  }

  // Wait before next iteration (simulates user reading/playing)
  sleep(randomIntBetween(15, 30));
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(1)} seconds`);
}

function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
