'use client';

/**
 * Frontend Fetch Wrapper
 * 
 * Provides consistent error handling for API calls:
 * - Parses JSON responses safely
 * - Throws typed errors for error boundary catching
 * - Handles specific status codes (401, 403, 429, 500)
 */

export class ApiError extends Error {
  public status: number;
  public code: string;
  public requestId: string | null;
  public retryAfter: number | null;

  constructor(
    message: string,
    status: number,
    code: string = 'UNKNOWN',
    requestId: string | null = null,
    retryAfter: number | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

interface FetchOptions extends RequestInit {
  /**
   * If true, throws error on non-2xx responses (default: true)
   */
  throwOnError?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  requestId: string | null;
}

/**
 * Safe JSON parsing
 */
async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return null;
  }
  
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Extract request ID from response headers
 */
function getRequestId(response: Response): string | null {
  return response.headers.get('x-request-id');
}

/**
 * Extract Retry-After header
 */
function getRetryAfter(response: Response): number | null {
  const header = response.headers.get('retry-after');
  if (!header) return null;
  const seconds = parseInt(header, 10);
  return isNaN(seconds) ? null : seconds;
}

/**
 * Main fetch wrapper
 */
export async function fetcher<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { throwOnError = true, ...fetchOptions } = options;

  // Add default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const requestId = getRequestId(response);
  const body = await parseJsonSafely<{ error?: string; code?: string } & T>(response);

  if (!response.ok) {
    const errorMessage = body?.error || `Request failed with status ${response.status}`;
    const errorCode = body?.code || 'UNKNOWN';
    const retryAfter = getRetryAfter(response);

    const error = new ApiError(
      errorMessage,
      response.status,
      errorCode,
      requestId,
      retryAfter
    );

    if (throwOnError) {
      throw error;
    }

    // Return null data with error if not throwing
    return null as T;
  }

  return body as T;
}

/**
 * Typed GET request
 */
export async function get<T = unknown>(
  url: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'GET' });
}

/**
 * Typed POST request
 */
export async function post<T = unknown, B = unknown>(
  url: string,
  body: B,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Typed PUT request
 */
export async function put<T = unknown, B = unknown>(
  url: string,
  body: B,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<T> {
  return fetcher<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Typed DELETE request
 */
export async function del<T = unknown>(
  url: string,
  options?: Omit<FetchOptions, 'method'>
): Promise<T> {
  return fetcher<T>(url, { ...options, method: 'DELETE' });
}

/**
 * Safe fetch that returns { data, error } instead of throwing
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  try {
    const data = await fetcher<T>(url, { ...options, throwOnError: true });
    return { data, error: null, requestId: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: null, error, requestId: error.requestId };
    }
    // Unknown error
    return {
      data: null,
      error: new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        'NETWORK_ERROR'
      ),
      requestId: null,
    };
  }
}
