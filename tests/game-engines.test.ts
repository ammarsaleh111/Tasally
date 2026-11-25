import test from 'node:test';
import assert from 'node:assert/strict';

import { getDailyWord, evaluateGuess, isValidWord, LETTER_STATUS } from '../src/games/wordle/wordleLogic.js';
import { getDailyPuzzle as getNumbersDaily, evaluateExpression } from '../src/app/games/numbers/numbersLogic.js';
import { getDailyTrivia } from '../src/app/games/trivia/triviaLogic.js';
import { getTodaysPuzzle as getWaffleToday, initializeGame as initWaffle, CELL_STATES } from '../src/app/games/waffle/waffleLogic.js';
import { getTodaysPuzzle as getCombinationsToday } from '../src/app/games/combinations/combinationsLogic.js';
import { validateWord as validateSpellingWord, isPangram, calculateMaxScore } from '../src/app/games/spelling/spellingLogic.js';
import { getTodaysPuzzle as getConnectionsToday, getShuffledWords } from '../src/app/games/connections/connectionsLogic.js';
import { canFindWord } from '../src/app/games/strands/strandsLogic.js';
import { getDailyGameDataWithMeta } from '../src/data/all-data';

const TEST_DATE = new Date('2026-11-25T12:00:00Z'); // 2026-11-25 in Africa/Cairo

test('Wordle engine loads today word and evaluates exact match', () => {
  const answer = getDailyWord(TEST_DATE);
  assert.match(answer, /^[A-Z]{5}$/);
  assert.equal(isValidWord(answer), true);
  const evalResult = evaluateGuess(answer, answer);
  assert.deepEqual(evalResult, Array(5).fill(LETTER_STATUS.CORRECT));
});

test('Crossword engine loads today 5x5 interlocking puzzle', () => {
  const { data } = getDailyGameDataWithMeta<{
    grid: string[][];
    across: Record<string, string>;
    down: Record<string, string>;
    solution: { across: Record<string, string>; down: Record<string, string> };
  }>('crossword', '2026-11-25');
  assert.equal(data.grid.length, 5);
  assert.equal(data.grid[0].join(''), data.solution.across['1']);
  assert.ok(data.across['1'] && data.down['1']);
});

test('Numbers engine loads today puzzle and verifies known solution', () => {
  const puzzle = getNumbersDaily();
  assert.equal(puzzle.numbers.length, 6);
  assert.equal(evaluateExpression(puzzle.solution), puzzle.target);
});

test('Trivia engine loads 10 valid questions for today', () => {
  const trivia = getDailyTrivia();
  assert.equal(trivia.questions.length, 10);
  for (const q of trivia.questions) {
    assert.equal(q.options[q.correctIndex], q.answer);
  }
});

test('Waffle engine initializes and detects solved board', () => {
  const puzzle = getWaffleToday();
  const state = initWaffle(puzzle);
  assert.equal(state.gameStatus, 'playing');
  const solvedStates = state.solution.map((row: string[], r: number) =>
    row.map((ch: string, c: number) => (state.pattern[r][c] ? CELL_STATES.CORRECT : null))
  );
  assert.equal(solvedStates[0][0], CELL_STATES.CORRECT);
});

test('Combinations engine loads today fragments and bonusWords', () => {
  const puzzle = getCombinationsToday();
  assert.equal(puzzle.fragments.length, 6);
  assert.ok(puzzle.targetScore > 0);
  assert.ok(Array.isArray(puzzle.bonusWords) && puzzle.bonusWords.length > 0);
});

test('Spelling engine validates center-letter and pangram rules', () => {
  const { data } = getDailyGameDataWithMeta<{
    center: string;
    letters: string[];
    validWords: string[];
    pangrams: string[];
  }>('spelling', '2026-11-25');
  const all7 = [data.center, ...data.letters];
  const firstWord = data.validWords[0];
  const res = validateSpellingWord(firstWord, data.center, all7, data.validWords, []);
  assert.equal(res.valid, true);
  assert.equal(isPangram(data.pangrams[0], all7), true);
  assert.ok(calculateMaxScore(data.validWords, all7) > 0);
});

test('Connections engine loads 4 groups of 4 distinct words', () => {
  const puzzle = getConnectionsToday();
  assert.equal(puzzle.groups.length, 4);
  const words = getShuffledWords(puzzle);
  assert.equal(new Set(words).size, 16);
});

test('Strands engine finds spangram and all theme words in 6x8 grid', () => {
  const { data } = getDailyGameDataWithMeta<{
    theme: string;
    grid: string[][];
    words: string[];
    spangram: string;
  }>('strands', '2026-11-25');
  assert.equal(canFindWord(data.grid, data.spangram), true);
  for (const w of data.words) {
    assert.equal(canFindWord(data.grid, w), true);
  }
});
