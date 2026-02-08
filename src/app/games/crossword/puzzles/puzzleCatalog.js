import { getCairoDateKey } from "@/utils/cairoDate";
import { CROSSWORD_PUZZLES_JAN_2026 } from "./crossword-2026-01";
import { CROSSWORD_PUZZLES_FEB_2026 } from "./crossword-2026-02";

const OBSTACLE_TYPES = new Set([
  "none",
  "block",
  "circle",
  "triangle",
  "diamond",
  "wallRight",
  "wallDown",
]);

const HARD_OBSTACLES = new Set(["block", "circle", "triangle", "diamond"]);

const RAW_PUZZLES = [...CROSSWORD_PUZZLES_JAN_2026, ...CROSSWORD_PUZZLES_FEB_2026]
  .filter((p) => typeof p?.date === "string")
  .sort((a, b) => a.date.localeCompare(b.date));

const RAW_BY_DATE = new Map(RAW_PUZZLES.map((p) => [p.date, p]));
const LATEST_AVAILABLE = RAW_PUZZLES[RAW_PUZZLES.length - 1] ?? null;

function normalizeObstacle(rawObstacle) {
  if (!rawObstacle) return { type: "none" };
  if (typeof rawObstacle === "string" && OBSTACLE_TYPES.has(rawObstacle)) {
    return { type: rawObstacle };
  }
  if (typeof rawObstacle === "object" && rawObstacle.type && OBSTACLE_TYPES.has(rawObstacle.type)) {
    return { type: rawObstacle.type };
  }
  return { type: "none" };
}

function normalizeCell(rawCell) {
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
  const hasSolution = typeof rawCell.solution === "string" && rawCell.solution.trim().length > 0;

  // Compatibility path: if a puzzle author uses wall markers on fillable cells,
  // honor solution letters so bar-style puzzles can still be represented.
  if (obstacle.type !== "none" && hasSolution) {
    return {
      obstacle,
      solution: rawCell.solution.trim()[0].toUpperCase(),
    };
  }

  if (obstacle.type !== "none") {
    return { obstacle };
  }

  return {
    obstacle,
    solution: hasSolution ? rawCell.solution.trim()[0].toUpperCase() : undefined,
  };
}

function normalizeGrid(rawGrid) {
  if (!Array.isArray(rawGrid) || rawGrid.length === 0) {
    return [];
  }
  return rawGrid.map((row) => (Array.isArray(row) ? row.map(normalizeCell) : []));
}

function isFillableCell(cell) {
  if (!cell) return false;
  if (cell.obstacle?.type === "none") return typeof cell.solution === "string";
  // Compatibility path for bar-style cells with embedded barriers + solution.
  return typeof cell.solution === "string" && !HARD_OBSTACLES.has(cell.obstacle?.type);
}

function hasAcrossBarrier(cell) {
  return cell?.obstacle?.type === "wallRight";
}

function hasDownBarrier(cell) {
  return cell?.obstacle?.type === "wallDown";
}

function canContinueAcross(grid, r, c) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (r < 0 || r >= rows || c < 0 || c + 1 >= cols) return false;
  const current = grid[r][c];
  const next = grid[r][c + 1];
  if (!isFillableCell(current) || !isFillableCell(next)) return false;
  return !hasAcrossBarrier(current);
}

function canContinueDown(grid, r, c) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (r < 0 || r + 1 >= rows || c < 0 || c >= cols) return false;
  const current = grid[r][c];
  const next = grid[r + 1][c];
  if (!isFillableCell(current) || !isFillableCell(next)) return false;
  return !hasDownBarrier(current);
}

function collectCellsAcross(grid, startRow, startCol) {
  const cells = [{ r: startRow, c: startCol }];
  let c = startCol;
  while (canContinueAcross(grid, startRow, c)) {
    c += 1;
    cells.push({ r: startRow, c });
  }
  return cells;
}

function collectCellsDown(grid, startRow, startCol) {
  const cells = [{ r: startRow, c: startCol }];
  let r = startRow;
  while (canContinueDown(grid, r, startCol)) {
    r += 1;
    cells.push({ r, c: startCol });
  }
  return cells;
}

function toClueEntries(rawClues) {
  if (!rawClues) return [];
  if (Array.isArray(rawClues)) {
    return rawClues
      .filter((entry) => entry && Number.isFinite(Number(entry.number)))
      .map((entry) => ({ number: Number(entry.number), text: String(entry.text ?? entry.clue ?? "").trim() }));
  }
  return Object.entries(rawClues)
    .map(([number, text]) => ({ number: Number(number), text: String(text ?? "").trim() }))
    .filter((entry) => Number.isFinite(entry.number));
}

function mapCluesToStarts(rawClues, starts) {
  const entries = toClueEntries(rawClues);
  const byNumber = new Map(entries.map((entry) => [entry.number, entry.text]));
  const fallbackTexts = entries
    .filter((entry) => !starts.some((start) => start.number === entry.number))
    .map((entry) => entry.text);
  let fallbackIndex = 0;

  return starts.map((start) => ({
    number: start.number,
    text: byNumber.get(start.number) || fallbackTexts[fallbackIndex++] || `Clue ${start.number}`,
  }));
}

function computeNumberingAndSegments(grid) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const numberedGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  const acrossStarts = [];
  const downStarts = [];
  const acrossSegments = [];
  const downSegments = [];

  let clueNumber = 0;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = grid[r][c];
      if (!isFillableCell(cell)) continue;

      const startsAcross =
        !canContinueAcross(grid, r, c - 1) &&
        canContinueAcross(grid, r, c);
      const startsDown =
        !canContinueDown(grid, r - 1, c) &&
        canContinueDown(grid, r, c);

      if (!startsAcross && !startsDown) continue;

      clueNumber += 1;
      numberedGrid[r][c] = { ...numberedGrid[r][c], number: clueNumber };

      if (startsAcross) {
        const cells = collectCellsAcross(grid, r, c);
        acrossStarts.push({ r, c, number: clueNumber });
        acrossSegments.push({
          id: `A-${clueNumber}`,
          direction: "across",
          number: clueNumber,
          cells,
        });
      }

      if (startsDown) {
        const cells = collectCellsDown(grid, r, c);
        downStarts.push({ r, c, number: clueNumber });
        downSegments.push({
          id: `D-${clueNumber}`,
          direction: "down",
          number: clueNumber,
          cells,
        });
      }
    }
  }

  return {
    numberedGrid,
    acrossStarts,
    downStarts,
    segments: {
      across: acrossSegments,
      down: downSegments,
    },
  };
}

function buildPuzzleFromRaw(rawPuzzle, servedDate) {
  const normalizedGrid = normalizeGrid(rawPuzzle.grid);
  const rows = normalizedGrid.length;
  const cols = normalizedGrid[0]?.length ?? 0;

  const { numberedGrid, acrossStarts, downStarts } = computeNumberingAndSegments(normalizedGrid);
  const acrossClues = mapCluesToStarts(rawPuzzle.clues?.across ?? rawPuzzle.across, acrossStarts);
  const downClues = mapCluesToStarts(rawPuzzle.clues?.down ?? rawPuzzle.down, downStarts);

  return {
    date: servedDate,
    size: { rows, cols },
    grid: numberedGrid,
    clues: {
      across: acrossClues,
      down: downClues,
    },
  };
}

export function getAvailableCrosswordDates() {
  return RAW_PUZZLES.map((p) => p.date);
}

export function getLatestAvailableCrosswordDate() {
  return LATEST_AVAILABLE?.date ?? null;
}

export function getDailyCrosswordPayload(dateParam) {
  const requestedDate = dateParam || getCairoDateKey();
  const servedRawPuzzle = RAW_BY_DATE.get(requestedDate) ?? LATEST_AVAILABLE;

  if (!servedRawPuzzle) {
    return null;
  }

  const servedDate = servedRawPuzzle.date;
  const puzzle = buildPuzzleFromRaw(servedRawPuzzle, servedDate);

  return {
    requestedDate,
    servedDate,
    usingFallback: servedDate !== requestedDate,
    latestAvailableDate: LATEST_AVAILABLE?.date ?? servedDate,
    puzzle,
  };
}
