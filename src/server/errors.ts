import { ZodError } from "zod";

export type HttpError = {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message = "Login required", details?: Record<string, unknown>) {
    super(401, "UNAUTHORIZED", message, details);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: Record<string, unknown>) {
    super(403, "FORBIDDEN", message, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", details?: Record<string, unknown>) {
    super(404, "NOT_FOUND", message, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", details?: Record<string, unknown>, status: 400 | 422 = 422) {
    super(status, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: Record<string, unknown>) {
    super(409, "CONFLICT", message, details);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: Record<string, unknown>) {
    super(429, "RATE_LIMITED", message, details);
    this.name = "RateLimitError";
  }
}

export class DbError extends AppError {
  constructor(message = "Database error", details?: Record<string, unknown>) {
    super(500, "DB_ERROR", message, details);
    this.name = "DbError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "Service unavailable", details?: Record<string, unknown>, status: 502 | 503 = 502) {
    super(status, "EXTERNAL_SERVICE_ERROR", message, details);
    this.name = "ExternalServiceError";
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof AppError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { issues: error.flatten() },
    };
  }

  if (typeof error === "object" && error && "status" in error && "message" in error) {
    const status = typeof (error as any).status === "number" ? (error as any).status : 500;
    return {
      status,
      code: "INTERNAL_ERROR",
      message: typeof (error as any).message === "string" ? (error as any).message : "Internal error",
    };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  };
}
