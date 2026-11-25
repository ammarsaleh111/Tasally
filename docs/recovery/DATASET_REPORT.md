# Dataset Validation Report

The checked-in dataset covers 365 consecutive Cairo dates, from 25 November 2026 through 24 November 2027. Each of the nine games has 365 entries. The 3,285 entries and 3,650 trivia questions passed the repository validator. The cloud recovery changes preserve all historical and current puzzle JSON.

| Game | Additional verification |
| --- | --- |
| Wordle | Five-letter local dictionary answers and 365 distinct answers |
| Crossword | Every new grid has matching across and down answers, clues, and dictionary words |
| Numbers | Stored expressions reach their targets using only the supplied number multiplicities |
| Trivia | Correct indices match the answer, and normalized question text is unique. Independent calculations reproduced 2,892 answers for arithmetic, numeral bases, units, and polygon-angle templates |
| Waffle | 365 distinct solution grids. A constructive swap sequence reaches each solution within its move limit |
| Combinations | Every bonus word is constructible from distinct fragment tiles. Bonus words alone reach each target using the game's scoring function |
| Spelling | Seven unique letters, valid center usage, local dictionary words, and at least one pangram |
| Connections | Four groups and 16 distinct words per date. 365 distinct unordered word sets |
| Strands | Every spangram path spells the answer and touches opposite edges. The theme words admit disjoint paths that cover all remaining grid cells |

The independent signature comparison used answer content, grids, or unordered word/fragment/number sets as appropriate. It found 365 distinct signatures per game and no exact historical matches under those signatures. This is a comparison against available historical files and compatible record shapes.

Question-text uniqueness overstates trivia variety. The dataset contains 1,476 questions sourced from arithmetic templates and 584 Roman numeral conversions. Normalizing multiplication operand order exposed 451 repeated pairs. The remaining 758 answers need independent factual review. Strands has 365 different grids and 330 distinct theme-and-solution sets. Semantic ambiguity in Connections, editorial quality of Crossword clues, and difficulty calibration still need human review.

The July through 24 November 2026 gap remains unavailable. An HTTP request for an August date returned 404 as expected. Historical competition records should be preserved when filling future coverage gaps.
