import type { GameKey } from "../keys";

type DateRecord = Record<string, unknown>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureDateRecord(
  game: GameKey,
  monthKey: string,
  dataset: unknown
): DateRecord {
  assert(
    isObject(dataset),
    `[all-data/validate] ${game} ${monthKey}: dataset must be a date-keyed object.`
  );

  for (const dateKey of Object.keys(dataset)) {
    assert(
      /^\d{4}-\d{2}-\d{2}$/.test(dateKey),
      `[all-data/validate] ${game} ${monthKey}: invalid date key "${dateKey}".`
    );
  }

  return dataset;
}

function validateWordle(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] wordle ${dateKey}: expected object entry.`
  );
  assert(
    typeof value.answer === "string" && /^[A-Za-z]{5}$/.test(value.answer),
    `[all-data/validate] wordle ${dateKey}: answer must be exactly 5 letters.`
  );
}

function validateCrossword(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] crossword ${dateKey}: expected object entry.`
  );
  assert(
    Array.isArray(value.grid) && value.grid.length > 0,
    `[all-data/validate] crossword ${dateKey}: grid is required.`
  );

  for (const row of value.grid) {
    assert(
      Array.isArray(row),
      `[all-data/validate] crossword ${dateKey}: each grid row must be an array.`
    );
  }

  const hasAcross =
    (isObject(value.across) && Object.keys(value.across).length > 0) ||
    (isObject(value.clues) &&
      Array.isArray(value.clues.across) &&
      value.clues.across.length > 0);

  const hasDown =
    (isObject(value.down) && Object.keys(value.down).length > 0) ||
    (isObject(value.clues) &&
      Array.isArray(value.clues.down) &&
      value.clues.down.length > 0);

  assert(
    hasAcross && hasDown,
    `[all-data/validate] crossword ${dateKey}: both across and down clues are required.`
  );
}

function validateNumbers(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] numbers ${dateKey}: expected object entry.`
  );
  assert(
    Array.isArray(value.numbers) && value.numbers.length === 6,
    `[all-data/validate] numbers ${dateKey}: numbers must contain 6 values.`
  );
  for (const n of value.numbers) {
    assert(
      typeof n === "number" && Number.isFinite(n),
      `[all-data/validate] numbers ${dateKey}: numbers must be numeric.`
    );
  }
  assert(
    typeof value.target === "number" && Number.isFinite(value.target),
    `[all-data/validate] numbers ${dateKey}: target must be numeric.`
  );
}

function validateTrivia(dateKey: string, value: unknown): void {
  assert(
    Array.isArray(value) && value.length === 10,
    `[all-data/validate] trivia ${dateKey}: expected exactly 10 questions.`
  );

  value.forEach((q, index) => {
    assert(
      isObject(q),
      `[all-data/validate] trivia ${dateKey}: question ${index + 1} must be an object.`
    );
    assert(
      typeof q.question === "string" && q.question.trim().length > 0,
      `[all-data/validate] trivia ${dateKey}: question ${index + 1} text is required.`
    );
    assert(
      Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every(
          (option) => typeof option === "string" && option.trim().length > 0
        ),
      `[all-data/validate] trivia ${dateKey}: question ${index + 1} options are invalid.`
    );

    const hasCorrectIndex =
      typeof q.correctIndex === "number" &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex < q.options.length;
    const hasAnswer =
      typeof q.answer === "string" && q.options.includes(q.answer);

    assert(
      hasCorrectIndex || hasAnswer,
      `[all-data/validate] trivia ${dateKey}: question ${
        index + 1
      } must provide correctIndex or answer.`
    );
  });
}

function validateWaffle(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] waffle ${dateKey}: expected object entry.`
  );
  for (const field of ["grid", "solution"] as const) {
    const grid = value[field];
    assert(
      Array.isArray(grid) && grid.length === 5,
      `[all-data/validate] waffle ${dateKey}: ${field} must be a 5x5 grid.`
    );
    for (const row of grid) {
      assert(
        Array.isArray(row) && row.length === 5,
        `[all-data/validate] waffle ${dateKey}: ${field} must be a 5x5 grid.`
      );
      for (const cell of row) {
        assert(
          typeof cell === "string",
          `[all-data/validate] waffle ${dateKey}: ${field} cells must be strings.`
        );
      }
    }
  }
}

function validateCombinations(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] combinations ${dateKey}: expected object entry.`
  );
  assert(
    Array.isArray(value.fragments) &&
      value.fragments.length >= 3 &&
      value.fragments.every(
        (fragment) => typeof fragment === "string" && fragment.trim().length > 0
      ),
    `[all-data/validate] combinations ${dateKey}: fragments are invalid.`
  );
  assert(
    typeof value.targetScore === "number" && Number.isFinite(value.targetScore),
    `[all-data/validate] combinations ${dateKey}: targetScore must be numeric.`
  );
  assert(
    Array.isArray(value.bonusWords) &&
      value.bonusWords.every(
        (word) => typeof word === "string" && word.trim().length > 0
      ),
    `[all-data/validate] combinations ${dateKey}: bonusWords are invalid.`
  );
}

function validateSpelling(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] spelling ${dateKey}: expected object entry.`
  );
  assert(
    typeof value.center === "string" && /^[A-Za-z]$/.test(value.center),
    `[all-data/validate] spelling ${dateKey}: center must be a single letter.`
  );
  assert(
    Array.isArray(value.letters) &&
      value.letters.length === 6 &&
      value.letters.every(
        (letter) => typeof letter === "string" && /^[A-Za-z]$/.test(letter)
      ),
    `[all-data/validate] spelling ${dateKey}: letters must contain 6 single letters.`
  );
  assert(
    Array.isArray(value.validWords) &&
      value.validWords.length > 0 &&
      value.validWords.every(
        (word) => typeof word === "string" && word.trim().length >= 4
      ),
    `[all-data/validate] spelling ${dateKey}: validWords are invalid.`
  );
}

function validateConnections(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] connections ${dateKey}: expected object entry.`
  );
  assert(
    Array.isArray(value.groups) && value.groups.length === 4,
    `[all-data/validate] connections ${dateKey}: groups must contain exactly 4 categories.`
  );
  for (const [i, group] of (value.groups as unknown[]).entries()) {
    assert(
      isObject(group),
      `[all-data/validate] connections ${dateKey}: group ${i + 1} must be an object.`
    );
    assert(
      typeof (group as Record<string, unknown>).category === "string" &&
        ((group as Record<string, unknown>).category as string).trim().length > 0,
      `[all-data/validate] connections ${dateKey}: group ${i + 1} category is required.`
    );
    assert(
      Array.isArray((group as Record<string, unknown>).words) &&
        ((group as Record<string, unknown>).words as unknown[]).length === 4,
      `[all-data/validate] connections ${dateKey}: group ${i + 1} must have exactly 4 words.`
    );
  }
}

function validateStrands(dateKey: string, value: unknown): void {
  assert(
    isObject(value),
    `[all-data/validate] strands ${dateKey}: expected object entry.`
  );
  assert(
    typeof value.theme === "string" && value.theme.trim().length > 0,
    `[all-data/validate] strands ${dateKey}: theme is required.`
  );
  assert(
    Array.isArray(value.grid) && value.grid.length > 0,
    `[all-data/validate] strands ${dateKey}: grid is required.`
  );
  for (const row of value.grid) {
    assert(
      Array.isArray(row),
      `[all-data/validate] strands ${dateKey}: each grid row must be an array.`
    );
  }
  assert(
    Array.isArray(value.words) && value.words.length > 0,
    `[all-data/validate] strands ${dateKey}: words array is required.`
  );
}

const validators: Record<GameKey, (dateKey: string, value: unknown) => void> = {
  wordle: validateWordle,
  crossword: validateCrossword,
  numbers: validateNumbers,
  trivia: validateTrivia,
  waffle: validateWaffle,
  combinations: validateCombinations,
  spelling: validateSpelling,
  connections: validateConnections,
  strands: validateStrands,
};

export function validateMonthDataset(
  game: GameKey,
  monthKey: string,
  dataset: unknown
): DateRecord {
  const dateRecord = ensureDateRecord(game, monthKey, dataset);
  const validateEntry = validators[game];

  for (const [dateKey, value] of Object.entries(dateRecord)) {
    validateEntry(dateKey, value);
  }

  return dateRecord;
}
