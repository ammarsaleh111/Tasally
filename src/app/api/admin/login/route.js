import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ensureAdminAccount,
  verifyAdminCredentials,
  createAdminSession,
  validateAdminSession,
  invalidateAdminSession,
  isIpBlocked,
  recordFailedAttempt,
  clearLoginAttempts,
  getRemainingLockout,
} from '@/lib/adminAuth';
import { sanitizeString } from '@/utils/inputSanitizer';

const COOKIE_NAME = 'admin_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

export async function GET(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const authenticated = await validateAdminSession(token);
  return NextResponse.json({ authenticated });
}

export async function POST(request) {
  const clientIp = getClientIp(request);

  // Check if IP is blocked
  if (isIpBlocked(clientIp)) {
    const remainingSeconds = getRemainingLockout(clientIp);
    return NextResponse.json(
      { 
        error: 'Too many failed attempts. Please try again later.',
        remainingSeconds,
      }, 
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { username, password } = body || {};

  await ensureAdminAccount();

  // Validate input
  if (!username || !password) {
    recordFailedAttempt(clientIp);
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  // Sanitize username only — never sanitize passwords (BUG-005: escapeHtml mutates special chars)
  const cleanUsername = sanitizeString(username, 100);
  const cleanPassword = password; // passwords compared raw against stored value

  if (!cleanUsername || !cleanPassword) {
    recordFailedAttempt(clientIp);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  // Verify credentials
  const isValid = await verifyAdminCredentials(cleanUsername, cleanPassword);
  
  if (!isValid) {
    recordFailedAttempt(clientIp);
    
    // Generic error message to prevent enumeration
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Success - clear failed attempts
  clearLoginAttempts(clientIp);

  const sessionToken = await createAdminSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, sessionToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 6,
  });
  
  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (token) {
    await invalidateAdminSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  
  return response;
}
