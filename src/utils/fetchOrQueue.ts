/**
 * Smart Fetch Wrapper — fetchOrQueue
 * ─────────────────────────────────────────────────────────
 * Tries a normal fetch. If the device is offline or the
 * request fails with a network / server error, the request
 * is saved to the offline sync queue for later retry.
 *
 * 4xx errors (except 429) are NOT queued — they will never
 * succeed on retry.
 * ─────────────────────────────────────────────────────────
 */

import { enqueue } from "./offlineSyncQueue";
import { getResultIdentity, isResultEndpoint, RESULT_IDENTITY_HEADER } from "./resultIdentity";

export interface FetchOrQueueResult<T = unknown> {
  /** Whether the response came back from the server (online) */
  ok: boolean;
  /** HTTP status code (0 when queued) */
  status: number;
  /** Parsed response body (null when queued) */
  data: T | null;
  /** True if the request was saved for later sync */
  queued: boolean;
  /** Error message if the request failed and was NOT queued */
  error?: string;
}

const FETCH_TIMEOUT_MS = 8_000;

/**
 * Attempt a fetch; on failure queue it for offline sync.
 *
 * @param endpoint  URL path (e.g. `/api/results`)
 * @param method    HTTP method
 * @param body      JSON-serialisable payload
 * @param headers   Optional extra headers
 */
export async function fetchOrQueue<T = unknown>(
  endpoint: string,
  method: string = "POST",
  body: Record<string, unknown> = {},
  headers: Record<string, string> = { "Content-Type": "application/json" }
): Promise<FetchOrQueueResult<T>> {
  const identityId = isResultEndpoint(endpoint) ? getResultIdentity() : null;
  if (identityId) headers = { ...headers, [RESULT_IDENTITY_HEADER]: identityId };
  // ── Fast-path: obviously offline ──
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(endpoint, method, body, headers);
    return { ok: false, status: 0, data: null, queued: true };
  }

  // ── Try the request with a timeout ──
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(endpoint, {
      method,
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // Success
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as T;
      if (res.status === 202 && (data as { queued?: boolean } | null)?.queued) {
        return { ok: false, status: res.status, data: null, queued: true };
      }
      return { ok: true, status: res.status, data, queued: false };
    }

    // Duplicate / conflict — treat as success (idempotent)
    if (res.status === 409) {
      const data = (await res.json().catch(() => null)) as T;
      return { ok: true, status: res.status, data, queued: false };
    }

    // Rate-limited — queue for retry
    if (res.status === 429) {
      await enqueue(endpoint, method, body, headers);
      return { ok: false, status: 429, data: null, queued: true };
    }

    // Other 4xx — will never succeed, don't queue
    if (res.status >= 400 && res.status < 500) {
      return {
        ok: false,
        status: res.status,
        data: null,
        queued: false,
        error: `Request failed with ${res.status}`,
      };
    }

    // 5xx — server error, queue for retry
    await enqueue(endpoint, method, body, headers);
    return { ok: false, status: res.status, data: null, queued: true };
  } catch {
    // Network error / timeout / abort — queue
    await enqueue(endpoint, method, body, headers);
    return { ok: false, status: 0, data: null, queued: true };
  }
}
