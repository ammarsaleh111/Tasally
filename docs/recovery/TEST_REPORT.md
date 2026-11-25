# Test Report

- `npx tsc --noEmit`: Passed (exit code 0)
- `npm run lint`: Passed (exit code 0)
- `npm run validate:puzzles`: Passed (3,285/3,285 valid, 3,650 unique trivia questions)
- `npm run test:puzzles` (`tests/daily-data.test.ts`): Passed (4/4)
- `node --test tests/identity-lookup.test.mjs`: Passed (6/6)
- `npx tsx --test tests/game-engines.test.ts`: Passed (9/9)
- `node --test tests/sw-offline.test.mjs`: Passed (1/1)
- `npm run build`: Passed (77/77 static pages)
- `node tests/smoke-production.mjs`: Passed (21 routes, static JS MIME, `/api/crossword/daily`, `/api/health`)
