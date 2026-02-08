import { getCairoDateKey } from "@/data/all-data/utils/date";
import { getUserStorageKey } from "@/utils/storageKeys";

export { getCairoDateKey };

export const DIRECTIONS = {
  ACROSS: "across",
  DOWN: "down",
};

export const MAX_REVEALS_PER_PUZZLE = 3;

const HARD_OBSTACLES = new Set(["block", "circle", "triangle", "diamond"]);
const VALID_OBSTACLES = new Set([
  "none",
  "block",
  "circle",
  "triangle",
  "diamond",
  "wallRight",
  "wallDown",
]);

const LOCAL_PROGRESS_PREFIX = "crossword-progress-v3";

export function makeCellKey(r, c) {
  return `${r},${c}`;
}

function normalizeObstacle(obstacle) {
  if (!obstacle) return { type: "none" };
  if (typeof obstacle === "string" && VALID_OBSTACLES.has(obstacle)) {
    return { type: obstacle };
  }
  if (
    typeof obstacle === "object" &&
    typeof obstacle.type === "string" &&
    VALID_OBSTACLES.has(obstacle.type)
  ) {
    return { type: obstacle.type };
  }
  return { type: "none" };
}

function normalizeGridCell(rawCell) {
  if (typeof rawCell === "string") {
    const trimmed = rawCell.trim();
    if (!trimmed) return { obstacle: { type: "block" } };
    return {
      obstacle: { type: "none" },
      solution: trimmed[0].toUpperCase(),
    };
  }

  if (!rawCell || typeof rawCell !== "object") {
    return { obstacle: { type: "block" } };
  }

  const obstacle = normalizeObstacle(rawCell.obstacle);
  const solution = typeof rawCell.solution === "string" && rawCell.solution.trim().length > 0
    ? rawCell.solution.trim()[0].toUpperCase()
    : undefined;

  if (obstacle.type === "none") {
    return {
      obstacle,
      solution,
      number: Number.isFinite(Number(rawCell.number)) ? Number(rawCell.number) : undefined,
    };
  }

  if (solution) {
    // Compatibility path for bar-style cells carrying both walls and letters.
    return {
      obstacle,
      solution,
      number: Number.isFinite(Number(rawCell.number)) ? Number(rawCell.number) : undefined,
    };
  }

  return {
    obstacle,
    number: Number.isFinite(Number(rawCell.number)) ? Number(rawCell.number) : undefined,
  };
}

function normalizeClueList(rawClues) {
  if (Array.isArray(rawClues)) {
    return rawClues
      .filter((clue) => clue && Number.isFinite(Number(clue.number)))
      .map((clue) => ({
        number: Number(clue.number),
        text: String(clue.text ?? clue.clue ?? "").trim(),
      }));
  }

  if (!rawClues || typeof rawClues !== "object") {
    return [];
  }

  return Object.entries(rawClues)
    .map(([number, text]) => ({ number: Number(number), text: String(text ?? "").trim() }))
    .filter((clue) => Number.isFinite(clue.number));
}

export function normalizePuzzlePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid puzzle payload");
  }

  const grid = Array.isArray(payload.grid)
    ? payload.grid.map((row) => (Array.isArray(row) ? row.map(normalizeGridCell) : []))
    : [];

  if (!grid.length || !grid[0]?.length) {
    throw new Error("Puzzle grid is empty");
  }

  const rows = Number(payload.size?.rows) || grid.length;
  const cols = Number(payload.size?.cols) || grid[0].length;

  return {
    date: String(payload.date || payload.servedDate || "").trim(),
    size: { rows, cols },
    grid,
    clues: {
      across: normalizeClueList(payload.clues?.across ?? payload.across),
      down: normalizeClueList(payload.clues?.down ?? payload.down),
    },
  };
}

export function inBounds(puzzle, r, c) {
  return r >= 0 && r < puzzle.size.rows && c >= 0 && c < puzzle.size.cols;
}

export function getCell(puzzle, r, c) {
  if (!inBounds(puzzle, r, c)) return null;
  return puzzle.grid[r]?.[c] ?? null;
}

export function isFillableCell(cell) {
  if (!cell) return false;
  if (cell.obstacle?.type === "none") {
    return typeof cell.solution === "string" && cell.solution.length > 0;
  }
  // Compatibility path for wall-marked fillable cells.
  return typeof cell.solution === "string" && !HARD_OBSTACLES.has(cell.obstacle?.type);
}

export function isPlayableAt(puzzle, r, c) {
  return isFillableCell(getCell(puzzle, r, c));
}

export function hasAcrossBarrier(cell) {
  return cell?.obstacle?.type === "wallRight";
}

export function hasDownBarrier(cell) {
  return cell?.obstacle?.type === "wallDown";
}

export function canContinueAcross(puzzle, r, c) {
  if (!inBounds(puzzle, r, c) || !inBounds(puzzle, r, c + 1)) return false;
  const current = getCell(puzzle, r, c);
  const next = getCell(puzzle, r, c + 1);
  if (!isFillableCell(current) || !isFillableCell(next)) return false;
  return !hasAcrossBarrier(current);
}

export function canContinueDown(puzzle, r, c) {
  if (!inBounds(puzzle, r, c) || !inBounds(puzzle, r + 1, c)) return false;
  const current = getCell(puzzle, r, c);
  const next = getCell(puzzle, r + 1, c);
  if (!isFillableCell(current) || !isFillableCell(next)) return false;
  return !hasDownBarrier(current);
}

function collectAcrossCells(puzzle, startRow, startCol) {
  const cells = [{ r: startRow, c: startCol }];
  let c = startCol;
  while (canContinueAcross(puzzle, startRow, c)) {
    c += 1;
    cells.push({ r: startRow, c });
  }
  return cells;
}

function collectDownCells(puzzle, startRow, startCol) {
  const cells = [{ r: startRow, c: startCol }];
  let r = startRow;
  while (canContinueDown(puzzle, r, startCol)) {
    r += 1;
    cells.push({ r, c: startCol });
  }
  return cells;
}

function clueLookup(clues) {
  return new Map((clues || []).map((clue) => [clue.number, clue.text]));
}

function defaultClue(number) {
  return `Clue ${number}`;
}

export function buildCrosswordModel(puzzle) {
  const acrossText = clueLookup(puzzle.clues?.across);
  const downText = clueLookup(puzzle.clues?.down);

  const segments = [];
  const segmentById = new Map();
  const cellToAcross = new Map();
  const cellToDown = new Map();
  const numberByCell = new Map();

  const acrossClues = [];
  const downClues = [];

  let clueNumber = 0;

  for (let r = 0; r < puzzle.size.rows; r += 1) {
    for (let c = 0; c < puzzle.size.cols; c += 1) {
      if (!isPlayableAt(puzzle, r, c)) continue;

      const startsAcross =
        !canContinueAcross(puzzle, r, c - 1) &&
        canContinueAcross(puzzle, r, c);
      const startsDown =
        !canContinueDown(puzzle, r - 1, c) &&
        canContinueDown(puzzle, r, c);

      if (!startsAcross && !startsDown) continue;

      clueNumber += 1;
      const number = Number(getCell(puzzle, r, c)?.number) || clueNumber;
      numberByCell.set(makeCellKey(r, c), number);

      if (startsAcross) {
        const cells = collectAcrossCells(puzzle, r, c);
        const solution = cells.map((cell) => getCell(puzzle, cell.r, cell.c)?.solution || "").join("");
        const id = `A-${number}`;
        const clue = acrossText.get(number) || defaultClue(number);

        const segment = {
          id,
          direction: DIRECTIONS.ACROSS,
          number,
          clue,
          cells,
          solution,
        };

        segments.push(segment);
        segmentById.set(id, segment);
        acrossClues.push({ id, number, text: clue });

        for (const cell of cells) {
          cellToAcross.set(makeCellKey(cell.r, cell.c), id);
        }
      }

      if (startsDown) {
        const cells = collectDownCells(puzzle, r, c);
        const solution = cells.map((cell) => getCell(puzzle, cell.r, cell.c)?.solution || "").join("");
        const id = `D-${number}`;
        const clue = downText.get(number) || defaultClue(number);

        const segment = {
          id,
          direction: DIRECTIONS.DOWN,
          number,
          clue,
          cells,
          solution,
        };

        segments.push(segment);
        segmentById.set(id, segment);
        downClues.push({ id, number, text: clue });

        for (const cell of cells) {
          cellToDown.set(makeCellKey(cell.r, cell.c), id);
        }
      }
    }
  }

  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  return {
    segments,
    segmentById,
    cellToAcross,
    cellToDown,
    numberByCell,
    clues: {
      across: acrossClues,
      down: downClues,
    },
  };
}

export function getSegmentForCell(model, row, col, direction) {
  const key = makeCellKey(row, col);
  const id = direction === DIRECTIONS.DOWN
    ? model.cellToDown.get(key)
    : model.cellToAcross.get(key);
  return id ? model.segmentById.get(id) ?? null : null;
}

export function resolveActiveSegment(model, row, col, preferredDirection) {
  const preferred = getSegmentForCell(model, row, col, preferredDirection);
  if (preferred) {
    return { segment: preferred, direction: preferredDirection };
  }

  const alternateDirection = preferredDirection === DIRECTIONS.ACROSS
    ? DIRECTIONS.DOWN
    : DIRECTIONS.ACROSS;
  const alternate = getSegmentForCell(model, row, col, alternateDirection);

  if (alternate) {
    return { segment: alternate, direction: alternateDirection };
  }

  return { segment: null, direction: preferredDirection };
}

export function createEmptyLetters(puzzle) {
  return Array.from({ length: puzzle.size.rows }, () =>
    Array.from({ length: puzzle.size.cols }, () => "")
  );
}

export function cloneLetters(letters) {
  return letters.map((row) => [...row]);
}

export function findFirstPlayableCell(puzzle) {
  for (let r = 0; r < puzzle.size.rows; r += 1) {
    for (let c = 0; c < puzzle.size.cols; c += 1) {
      if (isPlayableAt(puzzle, r, c)) {
        return { r, c };
      }
    }
  }
  return { r: 0, c: 0 };
}

export function evaluateSegment(segment, letters) {
  const entered = segment.cells.map((cell) => (letters[cell.r]?.[cell.c] || "").toUpperCase());
  const filled = entered.every((letter) => letter.length === 1);
  const entryWord = entered.join("");
  const solutionWord = segment.solution.toUpperCase();
  const correct = filled && entryWord === solutionWord;

  return {
    filled,
    correct,
    entryWord,
    solutionWord,
  };
}

export function recomputeSolvedAndLocked(puzzle, model, letters) {
  const solvedSegmentIds = new Set();
  const segmentResults = new Map();

  for (const segment of model.segments) {
    const result = evaluateSegment(segment, letters);
    segmentResults.set(segment.id, result);
    if (result.correct) {
      solvedSegmentIds.add(segment.id);
    }
  }

  const lockedCells = new Set();

  for (let r = 0; r < puzzle.size.rows; r += 1) {
    for (let c = 0; c < puzzle.size.cols; c += 1) {
      if (!isPlayableAt(puzzle, r, c)) continue;

      const key = makeCellKey(r, c);
      const entered = (letters[r]?.[c] || "").toUpperCase();
      const solution = (getCell(puzzle, r, c)?.solution || "").toUpperCase();
      if (!entered || entered !== solution) continue;

      const acrossId = model.cellToAcross.get(key);
      const downId = model.cellToDown.get(key);
      const locked =
        (acrossId && solvedSegmentIds.has(acrossId)) ||
        (downId && solvedSegmentIds.has(downId));

      if (locked) {
        lockedCells.add(key);
      }
    }
  }

  return {
    solvedSegmentIds,
    lockedCells,
    segmentResults,
  };
}

export function getNewlySolvedSegments(previousSolved, currentSolved) {
  const newlySolved = [];
  for (const id of currentSolved) {
    if (!previousSolved.has(id)) {
      newlySolved.push(id);
    }
  }
  return newlySolved;
}

export function isPuzzleSolved(model, solvedSegmentIds) {
  if (!model.segments.length) return false;
  return model.segments.every((segment) => solvedSegmentIds.has(segment.id));
}

export function getIncorrectSegments(model, segmentResults, direction = null) {
  const incorrect = [];
  for (const segment of model.segments) {
    if (direction && segment.direction !== direction) continue;
    const result = segmentResults.get(segment.id);
    if (result?.filled && !result.correct) {
      incorrect.push(segment.id);
    }
  }
  return incorrect;
}

export function findNextArrowCell(puzzle, row, col, arrowKey) {
  const deltas = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };

  const delta = deltas[arrowKey];
  if (!delta) return { r: row, c: col };

  let r = row + delta[0];
  let c = col + delta[1];

  while (inBounds(puzzle, r, c)) {
    if (isPlayableAt(puzzle, r, c)) {
      return { r, c };
    }
    r += delta[0];
    c += delta[1];
  }

  return { r: row, c: col };
}

function findCellIndex(segment, row, col) {
  return segment.cells.findIndex((cell) => cell.r === row && cell.c === col);
}

export function findNextEditableCellInSegment(segment, row, col, lockedCells) {
  const index = findCellIndex(segment, row, col);
  if (index === -1) return { r: row, c: col };

  for (let i = index + 1; i < segment.cells.length; i += 1) {
    const cell = segment.cells[i];
    if (!lockedCells.has(makeCellKey(cell.r, cell.c))) {
      return { r: cell.r, c: cell.c };
    }
  }

  return { r: row, c: col };
}

export function findPrevEditableCellInSegment(segment, row, col, lockedCells) {
  const index = findCellIndex(segment, row, col);
  if (index === -1) return { r: row, c: col };

  for (let i = index - 1; i >= 0; i -= 1) {
    const cell = segment.cells[i];
    if (!lockedCells.has(makeCellKey(cell.r, cell.c))) {
      return { r: cell.r, c: cell.c };
    }
  }

  return { r: row, c: col };
}

export function getTabNavigationTarget(model, currentSegmentId, direction, shiftKey = false) {
  const clueList = direction === DIRECTIONS.DOWN
    ? model.clues.down
    : model.clues.across;
  if (!clueList.length) return null;

  const currentIndex = clueList.findIndex((clue) => clue.id === currentSegmentId);
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const step = shiftKey ? -1 : 1;
  const nextIndex = (startIndex + step + clueList.length) % clueList.length;
  const target = clueList[nextIndex];

  return target ? model.segmentById.get(target.id) ?? null : null;
}

export function getHintLevel1({ model, letters, activeSegment, activeDirection, segmentResults }) {
  if (activeSegment) {
    const nextEmpty = activeSegment.cells.find((cell) => !(letters[cell.r]?.[cell.c] || ""));
    if (nextEmpty) {
      return {
        level: 1,
        type: "next-empty",
        segmentId: activeSegment.id,
        targetCell: nextEmpty,
        message: `Try the next empty cell in ${activeSegment.number}${activeSegment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`,
      };
    }

    const activeResult = segmentResults.get(activeSegment.id);
    if (activeResult?.filled && !activeResult.correct) {
      return {
        level: 1,
        type: "incorrect-segment",
        segmentId: activeSegment.id,
        targetCells: activeSegment.cells,
        message: `Check ${activeSegment.number}${activeSegment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`,
      };
    }
  }

  const preferred = model.segments.filter((segment) => segment.direction === activeDirection);
  const secondary = model.segments.filter((segment) => segment.direction !== activeDirection);

  for (const segment of [...preferred, ...secondary]) {
    const result = segmentResults.get(segment.id);
    if (result?.filled && !result.correct) {
      return {
        level: 1,
        type: "incorrect-segment",
        segmentId: segment.id,
        targetCells: segment.cells,
        message: `One completed word is incorrect. Recheck ${segment.number}${segment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`,
      };
    }
  }

  for (const segment of [...preferred, ...secondary]) {
    const nextEmpty = segment.cells.find((cell) => !(letters[cell.r]?.[cell.c] || ""));
    if (nextEmpty) {
      return {
        level: 1,
        type: "next-empty",
        segmentId: segment.id,
        targetCell: nextEmpty,
        message: `Try ${segment.number}${segment.direction === DIRECTIONS.ACROSS ? "A" : "D"} next.`,
      };
    }
  }

  return {
    level: 1,
    type: "none",
    message: "No hint needed. The puzzle is complete.",
  };
}

export function getHintLevel2({ activeSegment, letters, puzzle }) {
  if (!activeSegment) return null;

  const incorrectCells = [];

  for (const cell of activeSegment.cells) {
    const entered = (letters[cell.r]?.[cell.c] || "").toUpperCase();
    if (!entered) continue;

    const solution = (getCell(puzzle, cell.r, cell.c)?.solution || "").toUpperCase();
    if (entered !== solution) {
      incorrectCells.push({ r: cell.r, c: cell.c });
    }
  }

  return {
    level: 2,
    segmentId: activeSegment.id,
    incorrectCells,
    message: incorrectCells.length
      ? `${incorrectCells.length} letter${incorrectCells.length > 1 ? "s are" : " is"} incorrect in ${activeSegment.number}${activeSegment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`
      : `All filled letters are correct in ${activeSegment.number}${activeSegment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`,
  };
}

export function getHintLevel3({ activeSegment, letters, puzzle, lockedCells }) {
  if (!activeSegment) return null;

  for (const cell of activeSegment.cells) {
    const key = makeCellKey(cell.r, cell.c);
    if (lockedCells.has(key)) continue;

    const entered = (letters[cell.r]?.[cell.c] || "").toUpperCase();
    const solution = (getCell(puzzle, cell.r, cell.c)?.solution || "").toUpperCase();

    if (solution && entered !== solution) {
      return {
        level: 3,
        segmentId: activeSegment.id,
        reveal: {
          r: cell.r,
          c: cell.c,
          letter: solution,
        },
        message: `Revealed one letter in ${activeSegment.number}${activeSegment.direction === DIRECTIONS.ACROSS ? "A" : "D"}.`,
      };
    }
  }

  return null;
}

function ensureHintsState(rawHints) {
  if (!rawHints || typeof rawHints !== "object") {
    return {
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      revealsUsed: 0,
    };
  }

  return {
    level1Count: Number(rawHints.level1Count) || 0,
    level2Count: Number(rawHints.level2Count) || 0,
    level3Count: Number(rawHints.level3Count) || 0,
    revealsUsed: Number(rawHints.revealsUsed) || 0,
  };
}

export function buildProgressPayload({ letters, solvedSegmentIds, hintsUsed, activeCell, direction }) {
  return {
    letters,
    solvedSegmentIds: Array.from(solvedSegmentIds || []),
    hintsUsed: ensureHintsState(hintsUsed),
    activeCell,
    direction,
    savedAt: new Date().toISOString(),
  };
}

function normalizeLettersForPuzzle(letters, puzzle) {
  const grid = createEmptyLetters(puzzle);
  if (!Array.isArray(letters)) return grid;

  for (let r = 0; r < puzzle.size.rows; r += 1) {
    for (let c = 0; c < puzzle.size.cols; c += 1) {
      if (!isPlayableAt(puzzle, r, c)) continue;
      const value = String(letters?.[r]?.[c] || "").trim().toUpperCase();
      grid[r][c] = /^[A-Z]$/.test(value) ? value : "";
    }
  }

  return grid;
}

export function normalizeRestoredProgress(rawProgress, puzzle) {
  if (!rawProgress || typeof rawProgress !== "object") return null;

  const letters = normalizeLettersForPuzzle(rawProgress.letters, puzzle);
  const activeCell = rawProgress.activeCell;

  const safeActiveCell =
    activeCell &&
    Number.isInteger(activeCell.r) &&
    Number.isInteger(activeCell.c) &&
    isPlayableAt(puzzle, activeCell.r, activeCell.c)
      ? { r: activeCell.r, c: activeCell.c }
      : findFirstPlayableCell(puzzle);

  const direction = rawProgress.direction === DIRECTIONS.DOWN
    ? DIRECTIONS.DOWN
    : DIRECTIONS.ACROSS;

  return {
    letters,
    activeCell: safeActiveCell,
    direction,
    hintsUsed: ensureHintsState(rawProgress.hintsUsed),
  };
}

function localProgressStorageKey(dateKey) {
  return getUserStorageKey(`${LOCAL_PROGRESS_PREFIX}-${dateKey}`);
}

export function loadGuestProgress(dateKey, puzzle) {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(localProgressStorageKey(dateKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return normalizeRestoredProgress(parsed, puzzle);
  } catch (error) {
    console.warn("[crossword] Failed to load local progress", error);
    return null;
  }
}

export function saveGuestProgress(dateKey, progressPayload) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(localProgressStorageKey(dateKey), JSON.stringify(progressPayload));
  } catch (error) {
    console.warn("[crossword] Failed to save local progress", error);
  }
}

export function clearGuestProgress(dateKey) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(localProgressStorageKey(dateKey));
}

export function getSegmentCellKeys(segment) {
  return segment.cells.map((cell) => makeCellKey(cell.r, cell.c));
}

export function getActiveCellNumber(model, row, col) {
  return model.numberByCell.get(makeCellKey(row, col)) ?? null;
}
