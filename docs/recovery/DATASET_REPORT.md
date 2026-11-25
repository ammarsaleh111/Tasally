# Dataset Validation Report

- **Coverage**: `2026-11-25` through `2027-11-24` (365 consecutive days, 9 games = **3,285 daily puzzles**).
- **Historical Data**: Preserved `month-02` through `month-06` (`2026-02-01`..`2026-06-30`).
- **Gap (`2026-07-01`..`2026-11-24`)**: Intentionally left unavailable rather than fabricating historical competitive results.
- **Validation Results (`npm run validate:puzzles`)**:
  - `wordle`: 365/365 valid (0 invalid, 0 duplicates)
  - `crossword`: 365/365 valid (0 invalid, 5x5 interlocking grids verified against `common-english-words.json`)
  - `numbers`: 365/365 valid (0 invalid, verified with `evaluateExpression(solution) === target`)
  - `trivia`: 365/365 valid (0 invalid, **3,650 unique questions** verified)
  - `waffle`: 365/365 valid (0 invalid, letter inventory & swap solvability `<= 15` verified)
  - `combinations`: 365/365 valid (0 invalid, bonus words verified in dictionary)
  - `spelling`: 365/365 valid (0 invalid, 7 distinct letters, center-letter & pangrams verified)
  - `connections`: 365/365 valid (0 invalid, 16 distinct words per puzzle)
  - `strands`: 365/365 valid (0 invalid, 6x8 grid, 48-cell coverage, `canFindWord` & opposite-side spangram verified)
