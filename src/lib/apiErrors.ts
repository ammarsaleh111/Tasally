/**
 * Standardized API Error Responses
 * 
 * Provides consistent error formatting across all API routes.
 * Never leaks stack traces in production.
 * Includes request ID for support/debugging.
 */

import { NextResponse } from "next/server";

// Generate a unique request ID for error tracking
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

interface ApiErrorOptions {
  requestId?: string;
  details?: Record<string, unknown>;
}

interface ApiErrorBody {
  error: string;
  code: string;
  requestId: string;
  details?: Record<string, unknown>;
}

/**
 * Create standardized error response with headers
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  options: ApiErrorOptions = {},
  extraHeaders: Record<string, string> = {}
): NextResponse {
  const requestId = options.requestId || generateRequestId();
  
  const body: ApiErrorBody = {
    error: message,
    code,
    requestId,
  };
  
  // Only include details in development
  if (process.env.NODE_ENV !== 'production' && options.details) {
    body.details = options.details;
  }
  
  const response = NextResponse.json(body, { status });
  
  // Add standard headers
  response.headers.set('X-Request-Id', requestId);
  
  // Add any extra headers
  for (const [key, value] of Object.entries(extraHeaders)) {
    response.headers.set(key, value);
  }
  
  return response;
}

/**
 * Success response wrapper
 */
export function ok<T>(data: T, requestId?: string): NextResponse {
  const response = NextResponse.json(data);
  if (requestId) {
    response.headers.set('X-Request-Id', requestId);
  }
  return response;
}

/**
 * 400 Bad Request - Invalid input
 */
export function badRequest(message = "Invalid request", options?: ApiErrorOptions): NextResponse {
  return createErrorResponse(400, "BAD_REQUEST", message, options);
}

/**
 * 401 Unauthorized - Not authenticated
 */
export function unauthorized(message = "Authentication required", options?: ApiErrorOptions): NextResponse {
  return createErrorResponse(401, "UNAUTHORIZED", message, options);
}

/**
 * 403 Forbidden - Not allowed
 */
export function forbidden(message = "Access denied", options?: ApiErrorOptions): NextResponse {
  return createErrorResponse(403, "FORBIDDEN", message, options);
}

/**
 * 404 Not Found
 */
export function notFound(message = "Resource not found", options?: ApiErrorOptions): NextResponse {
  return createErrorResponse(404, "NOT_FOUND", message, options);
}

/**
 * 409 Conflict - Already exists or state conflict
 */
export function conflict(message = "Resource conflict", options?: ApiErrorOptions): NextResponse {
  return createErrorResponse(409, "CONFLICT", message, options);
}

/**
 * 429 Too Many Requests - Rate limited
 */
export function tooManyRequests(
  retryAfterSeconds: number = 60,
  message = "Too many requests",
  options?: ApiErrorOptions
): NextResponse {
  return createErrorResponse(
    429,
    "RATE_LIMITED",
    message,
    options,
    { 'Retry-After': String(retryAfterSeconds) }
  );
}

/**
 * 500 Internal Server Error - Generic error (no details in production)
 */
export function internalError(
  error?: Error | unknown,
  options?: ApiErrorOptions
): NextResponse {
  const requestId = options?.requestId || generateRequestId();
  
  // Log the full error server-side
  console.error(`[API Error] requestId=${requestId}`, error);
  
  // In development, include more details
  const details = process.env.NODE_ENV !== 'production' && error instanceof Error
    ? { message: error.message, stack: error.stack }
    : undefined;
  
  return createErrorResponse(
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred. Please try again.",
    { requestId, details }
  );
}

/**
 * 503 Service Unavailable
 */
export function serviceUnavailable(
  message = "Service temporarily unavailable",
  retryAfterSeconds?: number,
  options?: ApiErrorOptions
): NextResponse {
  const headers: Record<string, string> = {};
  if (retryAfterSeconds) {
    headers['Retry-After'] = String(retryAfterSeconds);
  }
  return createErrorResponse(503, "SERVICE_UNAVAILABLE", message, options, headers);
}

/**
 * Type-safe error handler for API routes
 */
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  options?: ApiErrorOptions
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return internalError(error, options);
  }
}
