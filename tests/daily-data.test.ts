import test from 'node:test';
import assert from 'node:assert/strict';
import { isDateKey, getCairoDateKey } from '../src/data/all-data/utils/date';
import { getDailyGameDataWithMeta, DailyPuzzleUnavailableError } from '../src/data/all-data';
import { GAME_KEYS } from '../src/data/all-data/manifest';

test('calendar dates must exist', () => {
  assert.equal(isDateKey('2026-02-29'), false);
  assert.equal(isDateKey('2024-02-29'), true);
  assert.equal(isDateKey('2028-02-29'), true);
  assert.equal(isDateKey('2026-13-01'), false);
  assert.equal(isDateKey('2026-11-25'), true);
});

test('Cairo date crosses midnight independently of UTC', () => {
  assert.equal(getCairoDateKey(new Date('2026-11-24T22:30:00Z')), '2026-11-25');
  assert.equal(getCairoDateKey(new Date('2026-11-24T21:59:59Z')), '2026-11-24');
});

test('all games report unsupported dates without inventing puzzles', () => {
  for (const game of GAME_KEYS) {
    assert.throws(() => getDailyGameDataWithMeta(game, '2026-08-15'), DailyPuzzleUnavailableError);
    assert.throws(() => getDailyGameDataWithMeta(game, '2027-12-01'), DailyPuzzleUnavailableError);
  }
});

test('all 9 games serve 365 consecutive days from 2026-11-25 to 2027-11-24 with exact date match', () => {
  const startMs = Date.UTC(2026, 10, 25);
  for (let i = 0; i < 365; i++) {
    const dateKey = new Date(startMs + i * 86400000).toISOString().slice(0, 10);
    for (const game of GAME_KEYS) {
      const res = getDailyGameDataWithMeta(game, dateKey);
      assert.equal(res.requestedDate, dateKey);
      assert.equal(res.servedDate, dateKey);
      assert.equal(res.usingFallback, false);
    }
  }
});
