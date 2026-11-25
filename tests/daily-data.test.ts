import test from 'node:test';
import assert from 'node:assert/strict';
import { isDateKey, getCairoDateKey } from '../src/data/all-data/utils/date';
import { getDailyGameDataWithMeta, DailyPuzzleUnavailableError } from '../src/data/all-data';
import { GAME_KEYS } from '../src/data/all-data/manifest';

test('calendar dates must exist', () => {
  assert.equal(isDateKey('2026-02-29'), false);
  assert.equal(isDateKey('2024-02-29'), true);
  assert.equal(isDateKey('2026-13-01'), false);
  assert.equal(isDateKey('2026-11-25'), true);
});
test('Cairo date crosses midnight independently of UTC', () => {
  assert.equal(getCairoDateKey(new Date('2026-11-24T22:30:00Z')), '2026-11-25');
});
test('all games report unsupported dates without inventing puzzles', () => {
  for (const game of GAME_KEYS) {
    assert.throws(() => getDailyGameDataWithMeta(game, '2026-11-25'), DailyPuzzleUnavailableError);
  }
});
