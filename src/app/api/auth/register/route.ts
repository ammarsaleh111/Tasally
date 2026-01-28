import { db, users } from "@/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_INPUT_LENGTHS, sanitizeName } from "@/utils/inputSanitizer";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(MAX_INPUT_LENGTHS.NAME).optional(),
});

export async function POST(request: Request) {
  try {
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

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("[auth/register]", error);
    return NextResponse.json({ error: "Unable to register" }, { status: 500 });
  }
}
