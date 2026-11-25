#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

import { CROSSWORD_WORD_BANK } from './puzzle-gen/crossword-bank.mjs';
import { CONNECTIONS_CATEGORIES } from './puzzle-gen/connections-bank.mjs';
import { STRANDS_THEMES } from './puzzle-gen/strands-bank.mjs';
import { buildTriviaPool } from './puzzle-gen/trivia-bank.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ALL_DATA_DIR = path.join(ROOT, 'src', 'data', 'all-data');

const wordlistEnglish = require('wordlist-english');
const commonEnglishWords = require(path.join(ROOT, 'src', 'data', 'dictionary', 'common-english-words.json'));
const { ALLOWED_WORDS } = await import(
  pathToFileURL(path.join(ROOT, 'src', 'games', 'wordle', 'wordLists', 'allowedWords.js')).href
);

// Deterministic Mulberry32 PRNG
function createRng(seed = 20261125) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(rng, arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateDates(startStr, count) {
  const dates = [];
  const [y, m, d] = startStr.split('-').map(Number);
  const startMs = Date.UTC(y, m - 1, d);
  for (let i = 0; i < count; i++) {
    const dt = new Date(startMs + i * 86400000);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

function readHistoricalAnswers(game) {
  const entries = [];
  for (const dir of ['month-02', 'month-03', 'month-04', 'month-05', 'month-06']) {
    const file = path.join(ALL_DATA_DIR, dir, `${game}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      entries.push(...Object.values(data));
    }
  }
  return entries;
}

// 1. WORDLE
function generateWordle(dates, rng) {
  const commonDictSet = new Set(commonEnglishWords.map((w) => w.toUpperCase()));
  const historical = new Set(readHistoricalAnswers('wordle').map((e) => String(e.answer || '').toUpperCase()));

  const common5 = Array.from(
    new Set([
      ...wordlistEnglish['english/10'],
      ...wordlistEnglish['english/20'],
      ...wordlistEnglish['english/35'],
      ...wordlistEnglish['english/40'],
    ])
  )
    .map((w) => w.toUpperCase())
    .filter((w) => /^[A-Z]{5}$/.test(w) && commonDictSet.has(w) && !historical.has(w));

  const picked = shuffle(rng, common5).slice(0, dates.length);
  if (picked.length < dates.length) {
    throw new Error(`Not enough Wordle words: ${picked.length} < ${dates.length}`);
  }
  const out = {};
  dates.forEach((d, i) => {
    out[d] = { answer: picked[i] };
  });
  return out;
}

// Helper for 5x5 interlocking word grids (Crossword & Waffle)
function generate5x5Grids(count, rng, excludeSignatures = new Set(), customWords = null) {
  const validBank = CROSSWORD_WORD_BANK.filter(
    ([w, c]) => typeof w === 'string' && /^[A-Z]{5}$/.test(w) && typeof c === 'string' && c.length > 0
  );
  const clueMap = new Map(validBank);
  const words = customWords ? Array.from(new Set(customWords)) : Array.from(clueMap.keys());

  // Index words by (w[0], w[2], w[4]) for fast lookup, and by w[0], w[2], w[4]
  const byL0 = new Map();
  const by024 = new Map();
  for (const w of words) {
    if (!byL0.has(w[0])) byL0.set(w[0], []);
    byL0.get(w[0]).push(w);
    const k = `${w[0]}${w[2]}${w[4]}`;
    if (!by024.has(k)) by024.set(k, []);
    by024.get(k).push(w);
  }

  const grids = [];
  const shuffledWords = shuffle(rng, words);
  let attempts = 0;

  while (grids.length < count && attempts < 200000) {
    attempts++;
    const a1 = shuffledWords[Math.floor(rng() * shuffledWords.length)];
    const d1Cands = byL0.get(a1[0]) || [];
    const d2Cands = byL0.get(a1[2]) || [];
    const d3Cands = byL0.get(a1[4]) || [];
    if (!d1Cands.length || !d2Cands.length || !d3Cands.length) continue;

    const d1 = d1Cands[Math.floor(rng() * d1Cands.length)];
    const d2 = d2Cands[Math.floor(rng() * d2Cands.length)];
    const d3 = d3Cands[Math.floor(rng() * d3Cands.length)];

    const k4 = `${d1[2]}${d2[2]}${d3[2]}`;
    const k5 = `${d1[4]}${d2[4]}${d3[4]}`;
    const a4Cands = by024.get(k4) || [];
    const a5Cands = by024.get(k5) || [];
    if (!a4Cands.length || !a5Cands.length) continue;

    const a4 = a4Cands[Math.floor(rng() * a4Cands.length)];
    const a5 = a5Cands[Math.floor(rng() * a5Cands.length)];

    const all6 = [a1, a4, a5, d1, d2, d3];
    if (new Set(all6).size !== 6) continue;

    const sig = all6.join('|');
    if (excludeSignatures.has(sig)) continue;
    excludeSignatures.add(sig);

    const grid = [
      a1.split(''),
      [d1[1], '', d2[1], '', d3[1]],
      a4.split(''),
      [d1[3], '', d2[3], '', d3[3]],
      a5.split(''),
    ];

    grids.push({
      grid,
      acrossWords: { 1: a1, 4: a4, 5: a5 },
      downWords: { 1: d1, 2: d2, 3: d3 },
      clueMap,
    });
  }

  if (grids.length < count) {
    throw new Error(`Only generated ${grids.length}/${count} 5x5 grids`);
  }
  return grids;
}

// 2. CROSSWORD
function generateCrossword(dates, rng, usedGridSigs) {
  const grids = generate5x5Grids(dates.length, rng, usedGridSigs);
  const out = {};
  dates.forEach((d, i) => {
    const g = grids[i];
    out[d] = {
      grid: g.grid,
      across: {
        '1': g.clueMap.get(g.acrossWords[1]),
        '4': g.clueMap.get(g.acrossWords[4]),
        '5': g.clueMap.get(g.acrossWords[5]),
      },
      down: {
        '1': g.clueMap.get(g.downWords[1]),
        '2': g.clueMap.get(g.downWords[2]),
        '3': g.clueMap.get(g.downWords[3]),
      },
      solution: {
        across: { '1': g.acrossWords[1], '4': g.acrossWords[4], '5': g.acrossWords[5] },
        down: { '1': g.downWords[1], '2': g.downWords[2], '3': g.downWords[3] },
      },
    };
  });
  return out;
}

// 3. WAFFLE
function minSwapsToSolve(startArr, targetArr) {
  // Compute minimum swaps between two arrays of same multiset (greedy/BFS or upper bound by cycle)
  const n = startArr.length;
  const arr = [...startArr];
  let swaps = 0;
  for (let i = 0; i < n; i++) {
    if (arr[i] === targetArr[i]) continue;
    // Prefer a direct 2-cycle swap if possible
    let swapIdx = -1;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] === targetArr[i] && arr[i] === targetArr[j]) {
        swapIdx = j;
        break;
      }
    }
    if (swapIdx === -1) {
      for (let j = i + 1; j < n; j++) {
        if (arr[j] === targetArr[i] && arr[j] !== targetArr[j]) {
          swapIdx = j;
          break;
        }
      }
    }
    if (swapIdx !== -1) {
      [arr[i], arr[swapIdx]] = [arr[swapIdx], arr[i]];
      swaps++;
    }
  }
  return swaps;
}

function generateWaffle(dates, rng, usedGridSigs) {
  const commonDictSet = new Set(commonEnglishWords.map((w) => w.toUpperCase()));
  const waffleWords = Array.from(
    new Set([
      ...wordlistEnglish['english/10'],
      ...wordlistEnglish['english/20'],
      ...wordlistEnglish['english/35'],
    ])
  )
    .map((w) => w.toUpperCase())
    .filter((w) => /^[A-Z]{5}$/.test(w) && commonDictSet.has(w));
  const grids = generate5x5Grids(dates.length, rng, usedGridSigs, waffleWords);
  const out = {};
  const letterCoords = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r % 2 === 0 || c % 2 === 0) letterCoords.push([r, c]);
    }
  }

  dates.forEach((d, i) => {
    const solution = grids[i].grid.map((row) => [...row]);
    const grid = solution.map((row) => [...row]);

    // Keep corners fixed for authentic Waffle feel and perform 9 swaps on remaining 17 cells
    const nonCornerCoords = letterCoords.filter(
      ([r, c]) => !((r === 0 || r === 4) && (c === 0 || c === 4))
    );

    for (let s = 0; s < 10; s++) {
      const a = nonCornerCoords[Math.floor(rng() * nonCornerCoords.length)];
      const b = nonCornerCoords[Math.floor(rng() * nonCornerCoords.length)];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      if (grid[a[0]][a[1]] === grid[b[0]][b[1]]) continue;
      const tmp = grid[a[0]][a[1]];
      grid[a[0]][a[1]] = grid[b[0]][b[1]];
      grid[b[0]][b[1]] = tmp;
    }

    const flatGrid = letterCoords.map(([r, c]) => grid[r][c]);
    const flatSol = letterCoords.map(([r, c]) => solution[r][c]);
    const swaps = minSwapsToSolve(flatGrid, flatSol);
    if (swaps === 0) {
      // Force at least one swap
      const [r1, c1] = nonCornerCoords[0];
      const [r2, c2] = nonCornerCoords.find(([r, c]) => grid[r][c] !== grid[r1][c1]);
      [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
    }

    out[d] = {
      grid,
      solution,
      maxMoves: 15,
    };
  });
  return out;
}

// 4. NUMBERS
function generateNumbers(dates, rng) {
  const largePool = [25, 50, 75, 100];
  const smallPool = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
  const out = {};

  for (const d of dates) {
    let entry = null;
    while (!entry) {
      const numLarge = rng() < 0.5 ? 1 : 2;
      const large = shuffle(rng, largePool).slice(0, numLarge);
      const small = shuffle(rng, smallPool).slice(0, 6 - numLarge);
      const numbers = shuffle(rng, [...large, ...small]);

      // Build random valid expression using 3 to 5 of the numbers
      const useCount = 3 + Math.floor(rng() * 3);
      const chosen = shuffle(rng, numbers).slice(0, useCount);
      let val = chosen[0];
      let expr = String(chosen[0]);
      let valid = true;

      for (let k = 1; k < chosen.length; k++) {
        const next = chosen[k];
        const ops = ['+', '-', '×'];
        if (next !== 0 && val % next === 0 && next > 1) ops.push('÷');
        const op = ops[Math.floor(rng() * ops.length)];

        if (op === '+') {
          val = val + next;
          expr = `(${expr} + ${next})`;
        } else if (op === '-') {
          if (val - next <= 0) {
            val = val + next;
            expr = `(${expr} + ${next})`;
          } else {
            val = val - next;
            expr = `(${expr} - ${next})`;
          }
        } else if (op === '×') {
          if (val * next > 999) {
            val = val + next;
            expr = `(${expr} + ${next})`;
          } else {
            val = val * next;
            expr = `${expr} × ${next}`;
          }
        } else if (op === '÷') {
          val = val / next;
          expr = `(${expr} ÷ ${next})`;
        }
      }

      if (Number.isInteger(val) && val >= 101 && val <= 999) {
        // Strip outer parens if any
        if (expr.startsWith('(') && expr.endsWith(')')) {
          expr = expr.slice(1, -1);
        }
        entry = { target: val, numbers, solution: expr };
      }
    }
    out[d] = entry;
  }
  return out;
}

// 5. TRIVIA
function generateTrivia(dates, rng) {
  const pool = buildTriviaPool(rng);
  const needed = dates.length * 10;
  if (pool.length < needed) {
    throw new Error(`Trivia pool too small: ${pool.length} < ${needed}`);
  }
  const shuffled = shuffle(rng, pool);
  const out = {};
  dates.forEach((d, idx) => {
    out[d] = shuffled.slice(idx * 10, (idx + 1) * 10);
  });
  return out;
}

// 6. COMBINATIONS
function generateCombinations(dates, rng) {
  const dictSet = new Set(commonEnglishWords.map((w) => w.toLowerCase()));
  const words = commonEnglishWords
    .map((w) => w.toLowerCase())
    .filter((w) => /^[a-z]{5,10}$/.test(w));

  // Build candidate 2-part and 3-part splits from real words
  const out = {};
  const usedKeys = new Set();
  const shuffledWords = shuffle(rng, words);
  let cursor = 0;

  for (const d of dates) {
    let found = null;
    while (!found && cursor < shuffledWords.length * 2) {
      const seedWords = [];
      for (let k = 0; k < 3; k++) {
        seedWords.push(shuffledWords[(cursor + k) % shuffledWords.length]);
      }
      cursor += 1;

      const frags = [];
      for (const w of seedWords) {
        const split = Math.floor(w.length / 2);
        frags.push(w.slice(0, split), w.slice(split));
      }
      if (new Set(frags).size !== 6) continue;
      if (frags.some((f) => f.length < 2)) continue;

      const key = [...frags].sort().join('|');
      if (usedKeys.has(key)) continue;

      // Find all valid 2-frag and 3-frag words in dictSet
      const validConstructed = new Set();
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          if (i === j) continue;
          const w2 = frags[i] + frags[j];
          if (w2.length >= 3 && dictSet.has(w2)) validConstructed.add(w2);
          for (let m = 0; m < 6; m++) {
            if (m === i || m === j) continue;
            const w3 = w2 + frags[m];
            if (w3.length >= 3 && dictSet.has(w3)) validConstructed.add(w3);
          }
        }
      }

      if (validConstructed.size >= 4) {
        usedKeys.add(key);
        const sortedWords = Array.from(validConstructed).sort((a, b) => b.length - a.length);
        const bonusWords = sortedWords.slice(0, Math.min(4, sortedWords.length));
        const maxPossible = sortedWords.length * 20 + bonusWords.length * 25;
        const targetScore = Math.min(120, Math.max(40, Math.floor(maxPossible * 0.55)));
        found = {
          fragments: shuffle(rng, frags),
          targetScore,
          bonusWords,
        };
      }
    }
    if (!found) throw new Error(`Failed to generate Combinations for ${d}`);
    out[d] = found;
  }
  return out;
}

// 7. SPELLING
function generateSpelling(dates, rng) {
  const words = commonEnglishWords
    .map((w) => w.toUpperCase())
    .filter((w) => /^[A-Z]{4,}$/.test(w));

  // Find words with exactly 7 distinct letters (pangrams)
  const pangramBuckets = new Map();
  for (const w of words) {
    const uniq = Array.from(new Set(w.split('')));
    if (uniq.length === 7) {
      const key = uniq.sort().join('');
      if (!pangramBuckets.has(key)) pangramBuckets.set(key, []);
      pangramBuckets.get(key).push(w);
    }
  }

  // Pre-index all words by their unique letter set bitmask
  const wordEntries = words.map((w) => {
    let mask = 0;
    for (const ch of w) mask |= 1 << (ch.charCodeAt(0) - 65);
    return { w, mask };
  });

  const bucketKeys = shuffle(rng, Array.from(pangramBuckets.keys()));
  const out = {};
  const usedPuzzles = new Set();

  for (const key of bucketKeys) {
    if (Object.keys(out).length >= dates.length) break;
    const letters7 = key.split('');
    let setMask = 0;
    for (const ch of letters7) setMask |= 1 << (ch.charCodeAt(0) - 65);

    // Words formed from a subset of these 7 letters
    const subsetWords = wordEntries.filter((e) => (e.mask & ~setMask) === 0).map((e) => e.w);
    if (subsetWords.length < 15) continue;

    // Try each of the 7 letters as center
    for (const center of shuffle(rng, letters7)) {
      const validWords = subsetWords.filter((w) => w.includes(center));
      if (validWords.length >= 14 && validWords.length <= 80) {
        const sig = `${center}:${key}`;
        if (usedPuzzles.has(sig)) continue;
        usedPuzzles.add(sig);

        const pangrams = pangramBuckets.get(key);
        const outer = letters7.filter((l) => l !== center);
        const dateKey = dates[Object.keys(out).length];
        out[dateKey] = {
          center,
          letters: outer,
          validWords: Array.from(new Set(validWords)).sort(),
          pangrams: Array.from(new Set(pangrams)).sort(),
        };
        break;
      }
    }
  }

  if (Object.keys(out).length < dates.length) {
    throw new Error(`Only generated ${Object.keys(out).length}/${dates.length} Spelling puzzles`);
  }
  return out;
}

// 8. CONNECTIONS
function generateConnections(dates, rng) {
  const out = {};
  const usedCombos = new Set();
  const t1 = CONNECTIONS_CATEGORIES[1];
  const t2 = CONNECTIONS_CATEGORIES[2];
  const t3 = CONNECTIONS_CATEGORIES[3];
  const t4 = CONNECTIONS_CATEGORIES[4];

  for (const d of dates) {
    let entry = null;
    let attempts = 0;
    while (!entry && attempts < 2000) {
      attempts++;
      const c1 = t1[Math.floor(rng() * t1.length)];
      const c2 = t2[Math.floor(rng() * t2.length)];
      const c3 = t3[Math.floor(rng() * t3.length)];
      const c4 = t4[Math.floor(rng() * t4.length)];

      const comboKey = `${c1.category}|${c2.category}|${c3.category}|${c4.category}`;
      if (usedCombos.has(comboKey)) continue;

      const allWords = [...c1.words, ...c2.words, ...c3.words, ...c4.words].map((w) => w.toUpperCase());
      if (new Set(allWords).size !== 16) continue;

      usedCombos.add(comboKey);
      entry = {
        groups: [
          { category: c1.category, words: c1.words.map((w) => w.toUpperCase()), difficulty: 1 },
          { category: c2.category, words: c2.words.map((w) => w.toUpperCase()), difficulty: 2 },
          { category: c3.category, words: c3.words.map((w) => w.toUpperCase()), difficulty: 3 },
          { category: c4.category, words: c4.words.map((w) => w.toUpperCase()), difficulty: 4 },
        ],
      };
    }
    if (!entry) throw new Error(`Failed to generate Connections for ${d}`);
    out[d] = entry;
  }
  return out;
}

// 9. STRANDS (6x8 = 48 cells, Hamiltonian snake + guaranteed opposite-side spangram)
function buildHamiltonianPaths6x8() {
  // Multiple valid Hamiltonian paths on 6x8 grid where a contiguous slice touches opposite sides
  const paths = [];
  // Variant A: vertical serpentine col 0..7
  const pA = [];
  for (let c = 0; c < 8; c++) {
    if (c % 2 === 0) {
      for (let r = 0; r < 6; r++) pA.push([r, c]);
    } else {
      for (let r = 5; r >= 0; r--) pA.push([r, c]);
    }
  }
  paths.push(pA);

  // Variant B: horizontal serpentine row 0..5
  const pB = [];
  for (let r = 0; r < 6; r++) {
    if (r % 2 === 0) {
      for (let c = 0; c < 8; c++) pB.push([r, c]);
    } else {
      for (let c = 7; c >= 0; c--) pB.push([r, c]);
    }
  }
  paths.push(pB);

  // Variant C: reversed vertical
  paths.push([...pA].reverse());
  // Variant D: reversed horizontal
  paths.push([...pB].reverse());

  return paths;
}

function touchesOppositeSides(coords) {
  const rows = coords.map(([r]) => r);
  const cols = coords.map(([, c]) => c);
  const topBottom = rows.includes(0) && rows.includes(5);
  const leftRight = cols.includes(0) && cols.includes(7);
  return topBottom || leftRight;
}

function subsetSum48(words, targetLen) {
  // Find a subset of words whose lengths sum to targetLen
  const n = words.length;
  function dfs(idx, curSum, chosen) {
    if (curSum === targetLen) return chosen;
    if (curSum > targetLen || idx >= n) return null;
    const withWord = dfs(idx + 1, curSum + words[idx].length, [...chosen, words[idx]]);
    if (withWord) return withWord;
    return dfs(idx + 1, curSum, chosen);
  }
  return dfs(0, 0, []);
}

function generateStrands(dates, rng) {
  const hamPaths = buildHamiltonianPaths6x8();
  const out = {};
  const usedSignatures = new Set();

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    let entry = null;

    for (let attempt = 0; attempt < 200 && !entry; attempt++) {
      const themeObj = STRANDS_THEMES[(i + attempt) % STRANDS_THEMES.length];
      const spangram = themeObj.spangram.toUpperCase();
      const shuffledPool = shuffle(rng, themeObj.words.map((w) => w.toUpperCase()));
      const selectedWords = subsetSum48(shuffledPool, 48 - spangram.length);
      if (!selectedWords) continue;

      const basePath = hamPaths[(i + attempt) % hamPaths.length];

      // Find a placement index for spangram along the Hamiltonian path that touches opposite sides
      // AND leaves exact prefix/suffix lengths for selectedWords (or place spangram at a valid boundary)
      for (let prefixWordCount = 0; prefixWordCount <= selectedWords.length; prefixWordCount++) {
        const prefixLen = selectedWords.slice(0, prefixWordCount).reduce((s, w) => s + w.length, 0);
        const spCoords = basePath.slice(prefixLen, prefixLen + spangram.length);
        if (spCoords.length !== spangram.length || !touchesOppositeSides(spCoords)) continue;

        const grid = Array.from({ length: 6 }, () => Array(8).fill(''));
        const orderedItems = [
          ...selectedWords.slice(0, prefixWordCount),
          spangram,
          ...selectedWords.slice(prefixWordCount),
        ];

        let pos = 0;
        for (const item of orderedItems) {
          for (const ch of item) {
            const [r, c] = basePath[pos++];
            grid[r][c] = ch;
          }
        }

        const sig = `${themeObj.theme}|${selectedWords.join(',')}|${prefixWordCount}|${(i + attempt) % hamPaths.length}`;
        if (usedSignatures.has(sig)) continue;
        usedSignatures.add(sig);

        entry = {
          theme: themeObj.theme,
          grid,
          words: selectedWords,
          spangram,
          spangramPath: spCoords,
        };
        break;
      }
    }

    if (!entry) throw new Error(`Failed to generate Strands for ${d}`);
    out[d] = entry;
  }

  return out;
}

function writeMonthBuckets(game, dateMap) {
  const byMonth = new Map();
  for (const [dateKey, value] of Object.entries(dateMap)) {
    const ym = dateKey.slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, {});
    byMonth.get(ym)[dateKey] = value;
  }

  for (const [ym, records] of byMonth.entries()) {
    const dir = path.join(ALL_DATA_DIR, ym);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${game}.json`), JSON.stringify(records, null, 2) + '\n', 'utf8');
  }
}

async function main() {
  const dates = generateDates('2026-11-25', 365);
  console.log(`Generating 365 days: ${dates[0]} .. ${dates[dates.length - 1]}`);

  const rng = createRng(20261125);
  const usedGridSigs = new Set();

  const wordle = generateWordle(dates, rng);
  console.log('✓ Wordle generated:', Object.keys(wordle).length);

  const crossword = generateCrossword(dates, rng, usedGridSigs);
  console.log('✓ Crossword generated:', Object.keys(crossword).length);

  const waffle = generateWaffle(dates, rng, usedGridSigs);
  console.log('✓ Waffle generated:', Object.keys(waffle).length);

  const numbers = generateNumbers(dates, rng);
  console.log('✓ Numbers generated:', Object.keys(numbers).length);

  const trivia = generateTrivia(dates, rng);
  console.log('✓ Trivia generated:', Object.keys(trivia).length);

  const combinations = generateCombinations(dates, rng);
  console.log('✓ Combinations generated:', Object.keys(combinations).length);

  const spelling = generateSpelling(dates, rng);
  console.log('✓ Spelling generated:', Object.keys(spelling).length);

  const connections = generateConnections(dates, rng);
  console.log('✓ Connections generated:', Object.keys(connections).length);

  const strands = generateStrands(dates, rng);
  console.log('✓ Strands generated:', Object.keys(strands).length);

  writeMonthBuckets('wordle', wordle);
  writeMonthBuckets('crossword', crossword);
  writeMonthBuckets('waffle', waffle);
  writeMonthBuckets('numbers', numbers);
  writeMonthBuckets('trivia', trivia);
  writeMonthBuckets('combinations', combinations);
  writeMonthBuckets('spelling', spelling);
  writeMonthBuckets('connections', connections);
  writeMonthBuckets('strands', strands);

  console.log('All 3,285 daily puzzles written to src/data/all-data/YYYY-MM/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
