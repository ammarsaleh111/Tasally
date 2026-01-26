import { db, users } from "@/db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = RegisterSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

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
        name: name ?? null,
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
