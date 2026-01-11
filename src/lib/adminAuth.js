import crypto from 'crypto';

// Default credentials - Change these via Environment Variables in production
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SecureAdmin#2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ammar-times-admin-secret-key-change-in-prod';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

// Helper to create a signature
function sign(data) {
  return crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(data)
    .digest('hex');
}

/**
 * Ensures admin account exists - in this stateless version, it just returns the config.
 * Kept for API compatibility.
 */
export async function ensureAdminAccount() {
  return {
    username: DEFAULT_ADMIN_USERNAME,
  };
}

/**
 * Verifies username and password against environment variables
 */
export async function verifyAdminCredentials(username, password) {
  // Use constant-time comparison in a real app, but simple strict equality 
  // is sufficient for this level of security if not exposing timing side-channels widely.
  return (
    username === DEFAULT_ADMIN_USERNAME && 
    password === DEFAULT_ADMIN_PASSWORD
  );
}

/**
 * Creates a stateless signed session token
 */
export async function createAdminSession() {
  const payload = JSON.stringify({
    user: DEFAULT_ADMIN_USERNAME,
    exp: Date.now() + SESSION_DURATION_MS,
  });
  
  const payloadB64 = Buffer.from(payload).toString('base64');
  const signature = sign(payloadB64);
  
  return `${payloadB64}.${signature}`;
}

/**
 * Validates the session token signature and expiration
 */
export async function validateAdminSession(token) {
  if (!token) return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadB64, signature] = parts;
  
  // Verify signature
  const expectedSignature = sign(payloadB64);
  if (signature !== expectedSignature) return false;
  
  // Verify expiration
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (Date.now() > payload.exp) return false;
    
    // Optional: Verify username still matches (if changed in env vars, invalidate old sessions)
    if (payload.user !== DEFAULT_ADMIN_USERNAME) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Invalidates session - client side just deletes cookie.
 * No server-side state to clear.
 */
export async function invalidateAdminSession(token) {
  return true;
}

export function getDefaultAdminCredentials() {
  return {
    username: DEFAULT_ADMIN_USERNAME,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}
