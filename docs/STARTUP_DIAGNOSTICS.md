# Startup Diagnostics Guide

## Overview

The startup diagnostics system helps you track and debug the application's initialization sequence.

## Enabling

Add to your `.env.local`:

```bash
NEXT_PUBLIC_DEBUG_STARTUP=true
```

Then restart your dev server:

```bash
npm run dev
```

## Usage

### In Components

```jsx
"use client";

import { logStartup } from "@/utils/startupDiagnostics";

export function MyComponent() {
  useEffect(() => {
    logStartup("MyComponent", "mounted");

    // Track data loading
    const fetchData = async () => {
      logStartup("MyComponent", "fetching data");
      const data = await fetch("/api/data");
      logStartup("MyComponent", "data loaded", { count: data.length });
    };

    fetchData();
  }, []);

  return <div>...</div>;
}
```

### Track Route Changes

```jsx
import { logRoute } from "@/utils/startupDiagnostics";

function handleNavigation(path) {
  logRoute(path);
  router.push(path);
}
```

### Track Data Loading

```jsx
import { logDataLoad } from "@/utils/startupDiagnostics";

async function loadPuzzle() {
  logDataLoad("Wordle", "start");

  try {
    const puzzle = await getTodaysPuzzle();
    logDataLoad("Wordle", "success", { date: puzzle.date });
  } catch (error) {
    logDataLoad("Wordle", "error", { error: error.message });
  }
}
```

### Track Theme Changes

```jsx
import { logTheme } from "@/utils/startupDiagnostics";

function setTheme(newTheme) {
  logTheme("applied", newTheme);
  applyThemeToDOM(newTheme);
}
```

### Performance Marking

```jsx
import { markStartup, measureStartup } from "@/utils/startupDiagnostics";

function initializeApp() {
  markStartup("app-init-start");

  // ... initialization code ...

  markStartup("app-init-end");
  measureStartup("app-initialization", "app-init-start", "app-init-end");
}
```

## Example Output

When enabled, you'll see logs like:

```
[🚀 Startup] [Router] navigated to /games/wordle (+150ms)
[🚀 Startup] [ThemeProvider] mounted (+45ms)
[🚀 Startup] [ThemeProvider] hydrated (+47ms) { theme: 'dark' }
[🚀 Startup] [Wordle] data ⏳ start (+152ms)
[🚀 Startup] [Wordle] data ✅ success (+156ms) { date: '2026-02-27' }
[🚀 Startup] [SessionInitializer] guest session created (+89ms)
[🚀 Startup] [Performance] app-initialization: 125ms
```

## API Reference

### `logStartup(component, event, data?)`

Generic startup log.

- **component**: String - Component or system name
- **event**: String - Event description
- **data**: Object (optional) - Additional context

### `logRoute(path)`

Log route navigation.

### `logDataLoad(game, status, details?)`

Log game data loading.

- **status**: 'start' | 'success' | 'error' | 'cached'

### `logTheme(action, theme)`

Log theme operations.

- **action**: 'applied' | 'changed' | 'loaded'
- **theme**: String - Theme identifier

### `logError(component, error)`

Log startup errors.

### `markStartup(name)`

Create a performance mark.

### `measureStartup(name, startMark, endMark)`

Measure time between two marks.

## Disabling in Production

The diagnostics system automatically disables in production unless explicitly enabled. Logs are zero-cost when disabled (no-op functions).

## Best Practices

1. **Be Specific:** Use descriptive component names
   - ✅ `logStartup('ThemeProvider', 'hydrated')`
   - ❌ `logStartup('Component', 'ready')`

2. **Track Critical Path:** Focus on the main initialization sequence
   - Theme loading
   - Data fetching
   - Session initialization
   - First render

3. **Include Context:** Add relevant data to logs

   ```js
   logStartup("Wordle", "puzzle loaded", {
     date: puzzle.date,
     word: puzzle.word.length + " letters",
   });
   ```

4. **Use Performance Marks:** For timing-critical operations
   ```js
   markStartup("render-start");
   // ... render logic ...
   markStartup("render-end");
   measureStartup("render-time", "render-start", "render-end");
   ```

## Typical Startup Sequence

Expected log sequence for a healthy startup:

```
1. [Router] navigated to /
2. [ThemeProvider] mounted
3. [ThemeProvider] hydrated
4. [SessionInitializer] checking existing session
5. [SessionInitializer] guest session created
6. [IdentityGate] identity loaded
7. [NotificationInitializer] initialized
8. [TutorialProvider] mounted
9. [SeasonIdentityProvider] theme applied
10. [HomePageClient] mounted
11. [HomePageClient] data loaded
```

## Troubleshooting

### Logs not appearing?

1. Check `.env.local` has `NEXT_PUBLIC_DEBUG_STARTUP=true`
2. Restart dev server
3. Check browser console (not terminal)
4. Verify import path is correct

### Too many logs?

Use browser console filters:

- Chrome: Filter by `[🚀 Startup]`
- Firefox: Filter by `Startup`

### Performance impact?

Logs have minimal impact in dev mode. They're no-ops in production unless explicitly enabled.

---

**Last Updated:** February 27, 2026
