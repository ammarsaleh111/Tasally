#!/usr/bin/env tsx
import commonEnglishWords from "../src/data/dictionary/common-english-words.json";
import { getDailyGameDataWithMeta, getMonthGameData } from "../src/data/all-data";
import { GAME_KEYS, MONTH_KEYS, type GameKey } from "../src/data/all-data/manifest";
import { evaluateExpression } from "../src/app/games/numbers/numbersLogic";
import { calculateWordScore } from "../src/app/games/combinations/combinationsLogic";

const DICT_SET = new Set(commonEnglishWords.map((w) => w.toUpperCase()));

function generateDateRange(startStr: string, days: number): string[] {
  const [y, m, d] = startStr.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, d);
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(new Date(startMs + i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function minSwaps(a: string[], b: string[]): number {
  const arr = [...a];
  let swaps = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === b[i]) continue;
    let idx = -1;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] === b[i] && arr[i] === b[j]) {
        idx = j;
        break;
      }
    }
    if (idx === -1) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] === b[i] && arr[j] !== b[j]) {
          idx = j;
          break;
        }
      }
    }
    if (idx !== -1) {
      [arr[i], arr[idx]] = [arr[idx], arr[i]];
      swaps++;
    }
  }
  return swaps;
}

function fragmentCount(word: string, fragments: string[]): number {
  if (!word) return 0;
  return Math.max(-Infinity, ...fragments.map((fragment, index) => {
    if (!word.startsWith(fragment)) return -Infinity;
    const remaining = fragments.filter((_, otherIndex) => otherIndex !== index);
    return 1 + fragmentCount(word.slice(fragment.length), remaining);
  }));
}

type Cell = [number, number];

function assertStrandsCover(grid: string[][], words: string[], spangram: string, path: Cell[]) {
  const height = grid.length;
  const width = grid[0].length;
  const adjacent = ([r, c]: Cell, [nextR, nextC]: Cell) =>
    Math.max(Math.abs(r - nextR), Math.abs(c - nextC)) === 1;
  const cellBit = ([r, c]: Cell) => 1n << BigInt(r * width + c);
  assert(path.length === spangram.length, "Spangram path length mismatch");
  let occupied = 0n;
  for (const [index, cell] of path.entries()) {
    const [r, c] = cell;
    assert(grid[r]?.[c] === spangram[index], "Spangram path does not spell the answer");
    assert(index === 0 || adjacent(path[index - 1], cell), "Non-adjacent spangram cells");
    const bit = cellBit(cell);
    assert((occupied & bit) === 0n, "Spangram reuses a cell");
    occupied |= bit;
  }
  const rows = path.map(([r]) => r);
  const cols = path.map(([, c]) => c);
  assert(
    (rows.includes(0) && rows.includes(height - 1)) || (cols.includes(0) && cols.includes(width - 1)),
    "Spangram must touch opposite sides",
  );

  const cells: Cell[] = grid.flatMap((row, r) => row.map((_, c): Cell => [r, c]));
  const neighbors = cells.map((cell) => cells.filter((other) => adjacent(cell, other)));
  const paths = words.map((word) => {
    const masks = new Set<bigint>();
    function walk(cell: Cell, index: number, used: bigint) {
      const [r, c] = cell;
      const bit = cellBit(cell);
      if (grid[r][c] !== word[index] || (used & bit) !== 0n) return;
      const next = used | bit;
      if (index === word.length - 1) {
        masks.add(next ^ occupied);
        return;
      }
      for (const neighbor of neighbors[r * width + c]) walk(neighbor, index + 1, next);
    }
    for (const cell of cells) walk(cell, 0, occupied);
    return [...masks];
  }).sort((a, b) => a.length - b.length);

  const fullGrid = (1n << BigInt(height * width)) - 1n;
  function canCover(index: number, used: bigint): boolean {
    if (index === paths.length) return used === fullGrid;
    return paths[index].some((mask) => (used & mask) === 0n && canCover(index + 1, used | mask));
  }
  assert(canCover(0, occupied), "Theme words cannot cover the grid without overlapping");
}

function main() {
  const targetDates = generateDateRange("2026-11-25", 365);
  assert(targetDates[0] === "2026-11-25", "Unexpected start date");
  assert(targetDates[targetDates.length - 1] === "2027-11-24", "Unexpected end date");

  // 1. Structural validation of all registered months (including historical month-02..06)
  for (const monthKey of MONTH_KEYS) {
    for (const game of GAME_KEYS) {
      getMonthGameData(game, monthKey);
    }
  }

  const stats: Record<GameKey, { valid: number; invalid: number; errors: string[] }> = {
    wordle: { valid: 0, invalid: 0, errors: [] },
    crossword: { valid: 0, invalid: 0, errors: [] },
    numbers: { valid: 0, invalid: 0, errors: [] },
    trivia: { valid: 0, invalid: 0, errors: [] },
    waffle: { valid: 0, invalid: 0, errors: [] },
    combinations: { valid: 0, invalid: 0, errors: [] },
    spelling: { valid: 0, invalid: 0, errors: [] },
    connections: { valid: 0, invalid: 0, errors: [] },
    strands: { valid: 0, invalid: 0, errors: [] },
  };

  const seenWordle = new Set<string>();
  const seenCrossword = new Set<string>();
  const seenTriviaQuestions = new Set<string>();
  const seenConnections = new Set<string>();

  for (const dateKey of targetDates) {
    // Wordle
    try {
      const { data, usingFallback, servedDate } = getDailyGameDataWithMeta<{ answer: string }>("wordle", dateKey);
      assert(!usingFallback && servedDate === dateKey, "Fallback used");
      const ans = data.answer.toUpperCase();
      assert(/^[A-Z]{5}$/.test(ans), `Invalid answer ${ans}`);
      assert(DICT_SET.has(ans), `Answer ${ans} not in local dictionary`);
      assert(!seenWordle.has(ans), `Duplicate Wordle answer ${ans}`);
      seenWordle.add(ans);
      stats.wordle.valid++;
    } catch (e) {
      stats.wordle.invalid++;
      stats.wordle.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Crossword
    try {
      const { data } = getDailyGameDataWithMeta<{
        grid: string[][];
        across: Record<string, string>;
        down: Record<string, string>;
        solution: { across: Record<string, string>; down: Record<string, string> };
      }>("crossword", dateKey);
      const a1 = data.grid[0].join("");
      const a4 = data.grid[2].join("");
      const a5 = data.grid[4].join("");
      const d1 = [0, 1, 2, 3, 4].map((r) => data.grid[r][0]).join("");
      const d2 = [0, 1, 2, 3, 4].map((r) => data.grid[r][2]).join("");
      const d3 = [0, 1, 2, 3, 4].map((r) => data.grid[r][4]).join("");
      assert(a1 === data.solution.across["1"] && a4 === data.solution.across["4"] && a5 === data.solution.across["5"], "Across mismatch");
      assert(d1 === data.solution.down["1"] && d2 === data.solution.down["2"] && d3 === data.solution.down["3"], "Down mismatch");
      for (const w of [a1, a4, a5, d1, d2, d3]) {
        assert(/^[A-Z]{5}$/.test(w) && DICT_SET.has(w), `Invalid crossword word ${w}`);
      }
      assert(data.across["1"] && data.across["4"] && data.across["5"] && data.down["1"] && data.down["2"] && data.down["3"], "Missing clue");
      const sig = [a1, a4, a5, d1, d2, d3].join("|");
      assert(!seenCrossword.has(sig), "Duplicate crossword grid");
      seenCrossword.add(sig);
      stats.crossword.valid++;
    } catch (e) {
      stats.crossword.invalid++;
      stats.crossword.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Numbers
    try {
      const { data } = getDailyGameDataWithMeta<{ target: number; numbers: number[]; solution: string }>("numbers", dateKey);
      assert(data.numbers.length === 6, "Must have 6 numbers");
      assert(typeof data.solution === "string" && data.solution.length > 0, "Missing solution");
      const evaluated = evaluateExpression(data.solution);
      assert(evaluated === data.target, `Solution "${data.solution}" evaluated to ${evaluated} !== ${data.target}`);
      // Verify number usage counts
      const usedNums = (data.solution.match(/\d+/g) || []).map(Number);
      const avail = new Map<number, number>();
      for (const n of data.numbers) avail.set(n, (avail.get(n) || 0) + 1);
      for (const u of usedNums) {
        const rem = avail.get(u) || 0;
        assert(rem > 0, `Number ${u} used more times than available`);
        avail.set(u, rem - 1);
      }
      stats.numbers.valid++;
    } catch (e) {
      stats.numbers.invalid++;
      stats.numbers.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Trivia
    try {
      const { data } = getDailyGameDataWithMeta<Array<{
        question: string;
        options: string[];
        answer: string;
        correctIndex: number;
      }>>("trivia", dateKey);
      assert(Array.isArray(data) && data.length === 10, "Expected 10 questions");
      for (const q of data) {
        assert(new Set(q.options).size === q.options.length, "Duplicate options");
        assert(q.options[q.correctIndex] === q.answer, "correctIndex mismatch");
        assert(!seenTriviaQuestions.has(q.question), `Duplicate trivia question: ${q.question}`);
        seenTriviaQuestions.add(q.question);
      }
      stats.trivia.valid++;
    } catch (e) {
      stats.trivia.invalid++;
      stats.trivia.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Waffle
    try {
      const { data } = getDailyGameDataWithMeta<{ grid: string[][]; solution: string[][]; maxMoves: number }>("waffle", dateKey);
      const coords: Array<[number, number]> = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r % 2 === 0 || c % 2 === 0) coords.push([r, c]);
          else assert(data.grid[r][c] === "" && data.solution[r][c] === "", "Corner/hole must be empty");
        }
      }
      const flatG = coords.map(([r, c]) => data.grid[r][c]);
      const flatS = coords.map(([r, c]) => data.solution[r][c]);
      assert([...flatG].sort().join("") === [...flatS].sort().join(""), "Letter inventory mismatch");
      const swaps = minSwaps(flatG, flatS);
      assert(swaps > 0 && swaps <= (data.maxMoves || 15), `Unsolvable or already solved: swaps=${swaps}`);
      for (const r of [0, 2, 4]) {
        const w = data.solution[r].join("");
        assert(DICT_SET.has(w), `Invalid waffle row word ${w}`);
      }
      for (const c of [0, 2, 4]) {
        const w = [0, 1, 2, 3, 4].map((r) => data.solution[r][c]).join("");
        assert(DICT_SET.has(w), `Invalid waffle col word ${w}`);
      }
      stats.waffle.valid++;
    } catch (e) {
      stats.waffle.invalid++;
      stats.waffle.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Combinations
    try {
      const { data } = getDailyGameDataWithMeta<{ fragments: string[]; targetScore: number; bonusWords: string[] }>("combinations", dateKey);
      assert(data.fragments.length === 6 && data.targetScore > 0, "Invalid fragments/targetScore");
      const fragments = data.fragments.map((fragment) => fragment.toLowerCase());
      assert(fragments.every((fragment) => /^[a-z]+$/.test(fragment)), "Invalid fragment");
      const bonusWords = new Set(data.bonusWords.map((word) => word.toLowerCase()));
      let bonusScore = 0;
      for (const bw of bonusWords) {
        assert(DICT_SET.has(bw.toUpperCase()), `Bonus word ${bw} not in dictionary`);
        const count = fragmentCount(bw, fragments);
        assert(Number.isFinite(count), `Bonus word ${bw} cannot be formed from the fragments`);
        bonusScore += calculateWordScore(count, true);
      }
      assert(bonusScore >= data.targetScore, "Bonus words alone do not prove the target score is reachable");
      stats.combinations.valid++;
    } catch (e) {
      stats.combinations.invalid++;
      stats.combinations.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Spelling
    try {
      const { data } = getDailyGameDataWithMeta<{ center: string; letters: string[]; validWords: string[]; pangrams: string[] }>("spelling", dateKey);
      const all7 = new Set([data.center.toUpperCase(), ...data.letters.map((l) => l.toUpperCase())]);
      assert(all7.size === 7, "Must have 7 distinct letters");
      assert(data.pangrams.length >= 1, "Must have at least 1 pangram");
      for (const w of data.validWords) {
        const up = w.toUpperCase();
        assert(up.length >= 4 && up.includes(data.center.toUpperCase()), `Invalid spelling word ${up}`);
        assert(up.split("").every((ch) => all7.has(ch)), `Word ${up} uses unavailable letter`);
        assert(DICT_SET.has(up), `Spelling word ${up} not in dictionary`);
      }
      for (const p of data.pangrams) {
        const pSet = new Set(p.toUpperCase().split(""));
        assert(Array.from(all7).every((l) => pSet.has(l)), `Pangram ${p} missing letters`);
      }
      stats.spelling.valid++;
    } catch (e) {
      stats.spelling.invalid++;
      stats.spelling.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Connections
    try {
      const { data } = getDailyGameDataWithMeta<{ groups: Array<{ category: string; words: string[]; difficulty: number }> }>("connections", dateKey);
      assert(data.groups.length === 4, "Must have 4 groups");
      const allWords = data.groups.flatMap((g) => g.words.map((w) => w.toUpperCase()));
      assert(new Set(allWords).size === 16, "Must have 16 distinct words");
      const sig = data.groups.map((g) => g.category).sort().join("|");
      assert(!seenConnections.has(sig), `Duplicate connections puzzle ${sig}`);
      seenConnections.add(sig);
      stats.connections.valid++;
    } catch (e) {
      stats.connections.invalid++;
      stats.connections.errors.push(`${dateKey}: ${(e as Error).message}`);
    }

    // Strands
    try {
      const { data } = getDailyGameDataWithMeta<{
        theme: string;
        grid: string[][];
        words: string[];
        spangram: string;
        spangramPath?: Array<[number, number]>;
      }>("strands", dateKey);
      assert(data.grid.length === 6 && data.grid.every((r) => r.length === 8), "Grid must be 6x8");
      const totalChars = data.words.reduce((s, w) => s + w.length, 0) + data.spangram.length;
      assert(totalChars === 48, `Expected 48 covered cells, got ${totalChars}`);
      assert(data.spangramPath, "Missing spangram path");
      assertStrandsCover(data.grid, data.words, data.spangram, data.spangramPath);
      stats.strands.valid++;
    } catch (e) {
      stats.strands.invalid++;
      stats.strands.errors.push(`${dateKey}: ${(e as Error).message}`);
    }
  }

  console.log("\n=== Tasally 1-Year Puzzle Dataset Validation Report (2026-11-25 .. 2027-11-24) ===");
  let totalInvalid = 0;
  for (const game of GAME_KEYS) {
    const s = stats[game];
    totalInvalid += s.invalid;
    console.log(`${game.padEnd(13)} | valid: ${String(s.valid).padStart(3)}/365 | invalid: ${s.invalid}`);
    if (s.errors.length > 0) {
      console.error("  Sample errors:", s.errors.slice(0, 5));
    }
  }
  console.log(`Total Trivia unique questions verified: ${seenTriviaQuestions.size}`);

  if (totalInvalid > 0) {
    console.error(`\n❌ Validation failed with ${totalInvalid} invalid entries.`);
    process.exit(1);
  }
  console.log("\n✅ All 3,285 daily puzzles (365 days × 9 games) passed strict semantic validation.");
}

main();
