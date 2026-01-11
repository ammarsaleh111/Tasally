// Numbers puzzles for February 2026
// Each puzzle has 6 numbers and a target

export const NUMBERS_PUZZLES_FEB_2026 = [
  { date: "2026-02-01", numbers: [2, 5, 7, 10, 25, 50], target: 347 },
  { date: "2026-02-02", numbers: [3, 6, 8, 12, 25, 75], target: 528 },
  { date: "2026-02-03", numbers: [4, 7, 9, 15, 50, 100], target: 682 },
  { date: "2026-02-04", numbers: [1, 5, 8, 11, 25, 50], target: 294 },
  { date: "2026-02-05", numbers: [3, 4, 9, 14, 75, 100], target: 756 },
  { date: "2026-02-06", numbers: [2, 6, 10, 13, 25, 75], target: 419 },
  { date: "2026-02-07", numbers: [5, 7, 11, 16, 50, 100], target: 835 },
  { date: "2026-02-08", numbers: [1, 4, 8, 12, 25, 50], target: 267 },
  { date: "2026-02-09", numbers: [3, 5, 9, 17, 75, 100], target: 643 },
  { date: "2026-02-10", numbers: [2, 7, 10, 14, 50, 75], target: 551 },
  { date: "2026-02-11", numbers: [4, 6, 11, 15, 25, 100], target: 728 },
  { date: "2026-02-12", numbers: [1, 5, 9, 13, 50, 75], target: 392 },
  { date: "2026-02-13", numbers: [3, 8, 12, 16, 25, 50], target: 476 },
  { date: "2026-02-14", numbers: [2, 4, 7, 10, 75, 100], target: 614 },
  { date: "2026-02-15", numbers: [5, 6, 10, 14, 25, 75], target: 583 },
  { date: "2026-02-16", numbers: [1, 7, 11, 17, 50, 100], target: 897 },
  { date: "2026-02-17", numbers: [3, 4, 8, 13, 25, 50], target: 321 },
  { date: "2026-02-18", numbers: [2, 5, 9, 15, 75, 100], target: 702 },
  { date: "2026-02-19", numbers: [4, 6, 12, 16, 50, 75], target: 615 },
  { date: "2026-02-20", numbers: [1, 8, 10, 11, 25, 100], target: 445 },
  { date: "2026-02-21", numbers: [3, 7, 13, 14, 50, 75], target: 781 },
  { date: "2026-02-22", numbers: [2, 5, 6, 17, 25, 50], target: 334 },
  { date: "2026-02-23", numbers: [4, 9, 11, 15, 75, 100], target: 869 },
  { date: "2026-02-24", numbers: [1, 3, 8, 12, 50, 75], target: 408 },
  { date: "2026-02-25", numbers: [5, 7, 10, 16, 25, 100], target: 672 },
  { date: "2026-02-26", numbers: [2, 4, 9, 13, 50, 75], target: 529 },
  { date: "2026-02-27", numbers: [3, 6, 11, 14, 25, 50], target: 362 },
  { date: "2026-02-28", numbers: [1, 5, 12, 17, 75, 100], target: 953 }
];

export const getNumbersForDate = (dateString) => {
  return NUMBERS_PUZZLES_FEB_2026.find(puzzle => puzzle.date === dateString) || null;
};
