/**
 * Startup Diagnostics Utility
 * ────────────────────────────────────────────────────────────
 * Lightweight logging system for tracking app initialization.
 * Enable with: NEXT_PUBLIC_DEBUG_STARTUP=true
 * 
 * Usage:
 * ```js
 * import { logStartup } from '@/utils/startupDiagnostics';
 * 
 * logStartup('ThemeProvider', 'mounted');
 * logStartup('ThemeProvider', 'hydrated', { theme: 'dark' });
 * ```
 * ────────────────────────────────────────────────────────────
 */

const ENABLED = process.env.NEXT_PUBLIC_DEBUG_STARTUP === 'true';
const PREFIX = '[🚀 Startup]';

// Track timing
const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

/**
 * Log startup event
 * @param {string} component - Component or system name
 * @param {string} event - Event description
 * @param {object} [data] - Optional additional data
 */
export function logStartup(component, event, data) {
  if (!ENABLED) return;
  
  const elapsed = typeof performance !== 'undefined' 
    ? Math.round(performance.now() - startTime)
    : Math.round(Date.now() - startTime);
  
  const message = `${PREFIX} [${component}] ${event} (+${elapsed}ms)`;
  
  if (data) {
    console.log(message, data);
  } else {
    console.log(message);
  }
}

/**
 * Log route change
 */
export function logRoute(path) {
  if (!ENABLED) return;
  logStartup('Router', `navigated to ${path}`);
}

/**
 * Log data loading
 */
export function logDataLoad(game, status, details) {
  if (!ENABLED) return;
  
  const statusEmoji = {
    start: '⏳',
    success: '✅',
    error: '❌',
    cached: '💾'
  };
  
  logStartup(game, `data ${statusEmoji[status] || ''} ${status}`, details);
}

/**
 * Log theme change
 */
export function logTheme(action, theme) {
  if (!ENABLED) return;
  logStartup('Theme', `${action}: ${theme}`);
}

/**
 * Log error
 */
export function logError(component, error) {
  if (!ENABLED) return;
  console.error(`${PREFIX} [${component}] ERROR:`, error);
}

/**
 * Group multiple logs
 */
export function logGroup(title, logs) {
  if (!ENABLED) return;
  console.group(`${PREFIX} ${title}`);
  logs.forEach(([component, event, data]) => {
    console.log(`[${component}] ${event}`, data || '');
  });
  console.groupEnd();
}

/**
 * Performance mark
 */
export function markStartup(name) {
  if (!ENABLED) return;
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`startup:${name}`);
  }
}

/**
 * Performance measure
 */
export function measureStartup(name, startMark, endMark) {
  if (!ENABLED) return;
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, `startup:${startMark}`, `startup:${endMark}`);
      const measure = performance.getEntriesByName(name)[0];
      logStartup('Performance', `${name}: ${Math.round(measure.duration)}ms`);
    } catch (e) {
      // Marks don't exist, ignore
    }
  }
}

const startupDiagnostics = {
  log: logStartup,
  route: logRoute,
  dataLoad: logDataLoad,
  theme: logTheme,
  error: logError,
  group: logGroup,
  mark: markStartup,
  measure: measureStartup,
};

export default startupDiagnostics;
