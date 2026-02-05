import { NextResponse } from "next/server";
import { toHttpError } from "./errors";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorPayload;
}

function buildDetails(details?: Record<string, unknown>) {
  if (!details) return undefined;
  if (process.env.NODE_ENV === "production") return undefined;
  return details;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  init?: ResponseInit
) {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(buildDetails(details) ? { details: buildDetails(details) } : {}),
      },
    },
    { status, ...(init ?? {}) }
  );
}

export function handleApiError(error: unknown) {
  const mapped = toHttpError(error);
  return fail(mapped.status, mapped.code, mapped.message, mapped.details);
}
