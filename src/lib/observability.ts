/**
 * Lightweight Observability Module
 * Server-side logging for request duration, DB queries, rate limits, errors
 * 
 * No external vendors - logs to console with structured format
 * Safe for serverless (no in-memory accumulation)
 */

export interface RequestMetrics {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  dbQueryCount?: number;
  rateLimited?: boolean;
  timestamp: string;
}

// Simple counters for the current request (reset per invocation in serverless)
let currentDbQueryCount = 0;

/**
 * Increment DB query counter for current request
 */
export function trackDbQuery() {
  currentDbQueryCount++;
}

/**
 * Reset counters (call at start of request)
 */
export function resetRequestMetrics() {
  currentDbQueryCount = 0;
}

/**
 * Get current DB query count
 */
export function getDbQueryCount(): number {
  return currentDbQueryCount;
}

/**
 * Log request metrics in a structured format
 * Format: [METRICS] route=X method=X status=X duration=Xms db_queries=X rate_limited=X
 */
export function logRequestMetrics(metrics: RequestMetrics): void {
  const parts = [
    `[METRICS]`,
    `route=${metrics.route}`,
    `method=${metrics.method}`,
    `status=${metrics.statusCode}`,
    `duration=${metrics.durationMs}ms`,
  ];

  if (metrics.dbQueryCount !== undefined) {
    parts.push(`db_queries=${metrics.dbQueryCount}`);
  }
  if (metrics.rateLimited) {
    parts.push(`rate_limited=true`);
  }

  console.log(parts.join(' '));
}

/**
 * Create a request timer
 */
export function createRequestTimer() {
  const start = performance.now();
  return {
    elapsed: () => Math.round(performance.now() - start),
  };
}

/**
 * Higher-order function to wrap API handlers with observability
 */
export function withObservability<T extends (...args: any[]) => Promise<Response>>(
  route: string,
  handler: T
): T {
  return (async (...args: Parameters<T>): Promise<Response> => {
    resetRequestMetrics();
    const timer = createRequestTimer();
    
    try {
      const response = await handler(...args);
      
      logRequestMetrics({
        route,
        method: (args[0] as Request)?.method || 'UNKNOWN',
        statusCode: response.status,
        durationMs: timer.elapsed(),
        dbQueryCount: getDbQueryCount(),
        timestamp: new Date().toISOString(),
      });
      
      return response;
    } catch (error) {
      const durationMs = timer.elapsed();
      console.error(`[ERROR] route=${route} duration=${durationMs}ms`, error);
      throw error;
    }
  }) as T;
}

/**
 * Log rate limit event
 */
export function logRateLimitHit(route: string, identifier: string): void {
  console.log(`[RATE_LIMIT] route=${route} identifier=${identifier.substring(0, 8)}...`);
}

/**
 * Log error with context
 */
export function logError(route: string, error: unknown, context?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] route=${route} message=${errorMessage}`, context || {});
}
