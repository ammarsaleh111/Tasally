/**
 * Client-Side API Wrapper
 * 
 * Provides a typed wrapper for API calls with:
 * - Standard error handling
 * - Automatic routing on errors (401 → login, 403 → forbidden, etc.)
 * - Type-safe responses
 * - User-friendly error messages
 */

import { AppSession, clearSession } from "../../utils/sessionManager";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiException";
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiError;
}

/**
 * Wrapper for fetch with standard error handling
 */
export async function apiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    let data: ApiResponse<T> | ApiErrorResponse;

    try {
      data = await response.json();
    } catch (parseError) {
      throw new ApiException(response.status, {
        code: "PARSE_ERROR",
        message: "Failed to parse server response",
      });
    }

    if (!response.ok || (data && "ok" in data && !data.ok)) {
      const error =
        data && "error" in data
          ? data.error
          : {
              code: "HTTP_ERROR",
              message: `HTTP ${response.status}`,
            };

      throw new ApiException(response.status, error);
    }

    if (data && "data" in data) {
      return data.data;
    }

    // Legacy responses that don't follow ok/data pattern
    return data as unknown as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(500, {
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    });
  }
}

/**
 * Handle API error and route user to appropriate page or show message
 */
export function handleApiError(error: unknown): string {
  if (!(error instanceof ApiException)) {
    return "An unexpected error occurred";
  }

  switch (error.status) {
    case 401: {
      // Unauthorized - route to login
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const nextPath = encodeURIComponent(currentPath);
        clearSession(); // Clear invalid session
        window.location.href = `/login?reason=session-expired&next=${nextPath}`;
      }
      return "Please log in to continue";
    }

    case 403: {
      // Forbidden - route to 403 page or show modal
      if (typeof window !== "undefined") {
        window.location.href = "/403";
      }
      return "You don't have permission to access this resource";
    }

    case 404: {
      // Not found
      return error.message || "Resource not found";
    }

    case 409: {
      // Conflict
      switch (error.code) {
        case "CONFLICT":
          return error.message || "This action conflicts with existing data";
        default:
          return error.message || "Conflict";
      }
    }

    case 422:
    case 400: {
      // Validation error
      if (error.details && typeof error.details === "object") {
        // Format Zod errors
        const issues = (error.details as any).issues;
        if (issues && issues.fieldErrors) {
          const fields = Object.keys(issues.fieldErrors);
          if (fields.length > 0) {
            const firstField = fields[0];
            const firstError = (issues.fieldErrors as any)[firstField]?.[0];
            return firstError || error.message || "Invalid input";
          }
        }
      }
      return error.message || "Invalid input";
    }

    case 429: {
      // Rate limited
      const retryAfter = error.details?.retryAfter;
      if (retryAfter && typeof retryAfter === "number") {
        return `Too many requests. Please try again in ${retryAfter} seconds.`;
      }
      return "Too many requests. Please try again later.";
    }

    case 500:
    case 502:
    case 503: {
      // Server error
      return "Something went wrong on our end. Please try again.";
    }

    default: {
      return error.message || "An error occurred";
    }
  }
}

/**
 * Show error as toast (requires toast system)
 */
export function showApiError(error: unknown, toastFn?: (msg: string) => void) {
  const message = handleApiError(error);
  if (toastFn) {
    toastFn(message);
  } else {
    console.error("[API Error]", message);
  }
}
