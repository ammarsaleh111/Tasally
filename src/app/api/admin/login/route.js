import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ensureAdminAccount,
  verifyAdminCredentials,
  createAdminSession,
  validateAdminSession,
  invalidateAdminSession,
} from '@/lib/adminAuth';

const COOKIE_NAME = 'admin_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/admin',
};

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const authenticated = await validateAdminSession(token);
  return NextResponse.json({ authenticated });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body;

  await ensureAdminAccount();

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const isValid = await verifyAdminCredentials(username, password);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const sessionToken = await createAdminSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, sessionToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 6,
  });
  return response;
}

export async function DELETE() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await invalidateAdminSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
