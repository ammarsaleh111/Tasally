// @ts-nocheck
import assert from "node:assert/strict";

import { getDailyGameDataWithMeta } from "../src/data/all-data";
import {
  DIRECTIONS,
  buildCrosswordModel,
  createEmptyLetters,
  findNextEditableCellInSegment,
  findPrevEditableCellInSegment,
  getHintLevel1,
  getHintLevel2,
  getHintLevel3,
  getSegmentForCell,
  normalizePuzzlePayload,
  recomputeSolvedAndLocked,
} from "../src/app/games/crossword/crosswordLogic";

function expect(condition: unknown, message: string) {
  assert.equal(Boolean(condition), true, message);
}

function testDailyPayloadFallback() {
  const exact = getDailyGameDataWithMeta("crossword", "2026-02-08");
  expect(exact, "Expected daily payload for exact date");
  assert.equal(exact.usingFallback, false);
  assert.equal(exact.requestedDate, "2026-02-08");
  assert.equal(exact.servedDate, "2026-02-08");

  assert.throws(
    () => getDailyGameDataWithMeta("crossword", "2099-01-01"),
    /Unsupported month key/
  );
}

function buildObstaclePuzzle() {
  return normalizePuzzlePayload({
    date: "2026-02-08",
    size: { rows: 4, cols: 4 },
    grid: [
      [
        { obstacle: { type: "none" }, solution: "A" },
        { obstacle: { type: "wallRight" }, solution: "B" },
        { obstacle: { type: "none" }, solution: "C" },
        { obstacle: { type: "block" } },
      ],
      [
        { obstacle: { type: "none" }, solution: "D" },
        { obstacle: { type: "circle" } },
        { obstacle: { type: "none" }, solution: "E" },
        { obstacle: { type: "none" }, solution: "F" },
      ],
      [
        { obstacle: { type: "none" }, solution: "G" },
        { obstacle: { type: "none" }, solution: "H" },
        { obstacle: { type: "wallDown" }, solution: "I" },
        { obstacle: { type: "none" }, solution: "J" },
      ],
      [
        { obstacle: { type: "none" }, solution: "K" },
        { obstacle: { type: "none" }, solution: "L" },
        { obstacle: { type: "none" }, solution: "M" },
        { obstacle: { type: "none" }, solution: "N" },
      ],
    ],
    clues: {
      across: [],
      down: [],
    },
  });
}

function testSegmentationAndWalls() {
  const puzzle = buildObstaclePuzzle();
  const model = buildCrosswordModel(puzzle);

  const acrossSegments = model.segments.filter((segment) => segment.direction === DIRECTIONS.ACROSS);
  const downSegments = model.segments.filter((segment) => segment.direction === DIRECTIONS.DOWN);

  assert.equal(acrossSegments.length, 4, "Expected 4 across segments");
  assert.equal(downSegments.length, 4, "Expected 4 down segments");

  const rowZeroAcross = getSegmentForCell(model, 0, 1, DIRECTIONS.ACROSS);
  expect(rowZeroAcross, "Expected row zero across segment");
  assert.equal(rowZeroAcross?.cells.length, 2, "wallRight should stop across continuation");

  const noAcrossAfterWall = getSegmentForCell(model, 0, 2, DIRECTIONS.ACROSS);
  assert.equal(noAcrossAfterWall, null, "Single cell should not become an across segment");

  const downWithWall = getSegmentForCell(model, 2, 2, DIRECTIONS.DOWN);
  expect(downWithWall, "Expected down segment at column 2");
  assert.deepEqual(
    downWithWall?.cells.map((cell) => cell.r),
    [0, 1, 2],
    "wallDown should block the continuation below row 2"
  );

  const blockedByWall = getSegmentForCell(model, 3, 2, DIRECTIONS.DOWN);
  assert.equal(blockedByWall, null, "Row 3 column 2 should not belong to the blocked down segment");
}

function testLockingAndHints() {
  const puzzle = buildObstaclePuzzle();
  const model = buildCrosswordModel(puzzle);

  const rowZeroAcross = getSegmentForCell(model, 0, 0, DIRECTIONS.ACROSS);
  const rowOneAcross = getSegmentForCell(model, 1, 2, DIRECTIONS.ACROSS);

  expect(rowZeroAcross, "Expected 0,0 across segment");
  expect(rowOneAcross, "Expected 1,2 across segment");

  const letters = createEmptyLetters(puzzle);
  letters[0][0] = "A";
  letters[0][1] = "B";

  const computed = recomputeSolvedAndLocked(puzzle, model, letters);
  expect(computed.solvedSegmentIds.has(rowZeroAcross!.id), "Solved segment should be detected immediately");
  expect(computed.lockedCells.has("0,0"), "Solved cell should be locked");
  expect(computed.lockedCells.has("0,1"), "Solved cell should be locked");

  const lettersHint = createEmptyLetters(puzzle);
  lettersHint[1][2] = "E";

  const resultOpen = recomputeSolvedAndLocked(puzzle, model, lettersHint);
  const hint1 = getHintLevel1({
    model,
    letters: lettersHint,
    activeSegment: rowOneAcross,
    activeDirection: DIRECTIONS.ACROSS,
    segmentResults: resultOpen.segmentResults,
  });

  assert.equal(hint1.type, "next-empty");
  assert.equal(hint1.targetCell?.r, 1);
  assert.equal(hint1.targetCell?.c, 3);

  lettersHint[1][3] = "X";
  const resultWrong = recomputeSolvedAndLocked(puzzle, model, lettersHint);

  const hint1Wrong = getHintLevel1({
    model,
    letters: lettersHint,
    activeSegment: rowOneAcross,
    activeDirection: DIRECTIONS.ACROSS,
    segmentResults: resultWrong.segmentResults,
  });

  assert.equal(hint1Wrong.type, "incorrect-segment");

  const hint2 = getHintLevel2({
    activeSegment: rowOneAcross,
    letters: lettersHint,
    puzzle,
  });

  assert.equal(hint2?.incorrectCells.length, 1);
  assert.deepEqual(hint2?.incorrectCells[0], { r: 1, c: 3 });

  const hint3 = getHintLevel3({
    activeSegment: rowOneAcross,
    letters: lettersHint,
    puzzle,
    lockedCells: new Set(),
  });

  assert.equal(hint3?.reveal.r, 1);
  assert.equal(hint3?.reveal.c, 3);
  assert.equal(hint3?.reveal.letter, "F");

  const rowTwoAcross = getSegmentForCell(model, 2, 0, DIRECTIONS.ACROSS);
  expect(rowTwoAcross, "Expected 2,0 across segment");

  const locked = new Set(["2,1", "2,2"]);
  const nextEditable = findNextEditableCellInSegment(rowTwoAcross!, 2, 0, locked);
  assert.deepEqual(nextEditable, { r: 2, c: 3 });

  const prevEditable = findPrevEditableCellInSegment(rowTwoAcross!, 2, 3, locked);
  assert.deepEqual(prevEditable, { r: 2, c: 0 });
}

function main() {
  testDailyPayloadFallback();
  testSegmentationAndWalls();
  testLockingAndHints();
  console.log("Crossword rewrite checks passed.");
}

main();
