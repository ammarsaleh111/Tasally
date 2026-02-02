import { db, users } from "@/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_INPUT_LENGTHS, sanitizeName } from "@/utils/inputSanitizer";
import { checkRateLimit, rateLimitResponse, getClientIP, buildRateLimitKey, RATE_LIMITS } from "@/lib/rateLimit";
import { createRequestTimer, logRequestMetrics, trackDbQuery } from "@/lib/observability";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(MAX_INPUT_LENGTHS.NAME).optional(),
});

export async function POST(request: Request) {
  const timer = createRequestTimer();
  
  try {
    // Rate limiting: 5/min per IP
    const clientIP = getClientIP(request);
    const rateLimitKey = buildRateLimitKey('register', clientIP);
    const rateResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.REGISTER.max,
      RATE_LIMITS.REGISTER.windowSeconds
    );

    if (!rateResult.allowed) {
      logRequestMetrics({
        route: '/api/auth/register',
        method: 'POST',
        statusCode: 429,
        durationMs: timer.elapsed(),
        rateLimited: true,
        timestamp: new Date().toISOString(),
      });
      return rateLimitResponse(rateResult, '/api/auth/register', clientIP);
    }

    const payload = await request.json();
    const parsed = RegisterSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;
    let safeName: string | null = null;

    if (name) {
      const sanitized = sanitizeName(name);
      if (!sanitized) {
        return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
      }
      safeName = sanitized;
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    trackDbQuery();

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const [created] = await db
      .insert(users)
      .values({
        email,
        name: safeName,
        displayName: safeName,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: users.id });
    trackDbQuery();

    logRequestMetrics({
      route: '/api/auth/register',
      method: 'POST',
      statusCode: 201,
      durationMs: timer.elapsed(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json({ error: "Unable to register" }, { status: 500 });
  }
}
