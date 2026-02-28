import crypto from 'crypto';

// Environment-based credentials - MUST be set in production (no fallback defaults)
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!DEFAULT_ADMIN_USERNAME || !DEFAULT_ADMIN_PASSWORD || !ADMIN_SECRET) {
  console.warn('[AdminAuth] WARNING: ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SECRET environment variables must be set. Admin login is disabled until they are configured.');
}
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

// Brute force protection
const loginAttempts = new Map(); // IP -> { count, firstAttempt, blockedUntil }
// Server-side token blocklist for session revocation (BUG-011)
const revokedTokens = new Set();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if IP is currently blocked from login attempts
 */
export function isIpBlocked(ip) {
  if (!ip || ip === 'unknown') return false;

  const record = loginAttempts.get(ip);
  if (!record) return false;

  // Check if still in lockout period
  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    return true;
  }

  // Reset if lockout expired
  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }

  return false;
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip) {
  if (!ip || ip === 'unknown') return;

  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    loginAttempts.set(ip, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
    });
    return;
  }

  // Reset if outside attempt window
  if (now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(ip, {
      count: 1,
      firstAttempt: now,
      blockedUntil: null,
    });
    return;
  }

  // Increment attempts
  record.count += 1;

  // Block if exceeded max attempts
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_DURATION_MS;
  }
}

/**
 * Clear login attempts for IP (on successful login)
 */
export function clearLoginAttempts(ip) {
  if (ip && ip !== 'unknown') {
    loginAttempts.delete(ip);
  }
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockout(ip) {
  const record = loginAttempts.get(ip);
  if (!record || !record.blockedUntil) return 0;
  
  const remaining = Math.max(0, record.blockedUntil - Date.now());
  return Math.ceil(remaining / 1000);
}

// Helper to create a signature using timing-safe comparison
function sign(data) {
  return crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(data)
    .digest('hex');
}

// Constant-time string comparison using HMAC to prevent length leaking
// Both inputs are hashed to fixed-length outputs before comparison
function hmacEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  try {
    const key = ADMIN_SECRET || 'comparison-key';
    const hmacA = crypto.createHmac('sha256', key).update(a).digest();
    const hmacB = crypto.createHmac('sha256', key).update(b).digest();
    return crypto.timingSafeEqual(hmacA, hmacB);
  } catch (e) {
    return false;
  }
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
 * Uses timing-safe comparison to prevent timing attacks
 */
export async function verifyAdminCredentials(username, password) {
  // Reject if env vars not configured
  if (!DEFAULT_ADMIN_USERNAME || !DEFAULT_ADMIN_PASSWORD) {
    return false;
  }

  // Input validation
  if (typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }

  if (username.length > 100 || password.length > 100) {
    return false;
  }

  // Only trim whitespace — never sanitize/escape passwords before comparison
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  // Use HMAC-based constant-time comparison to prevent timing attacks
  // This avoids leaking credential length via the early length check
  const usernameMatch = hmacEqual(cleanUsername, DEFAULT_ADMIN_USERNAME);
  const passwordMatch = hmacEqual(cleanPassword, DEFAULT_ADMIN_PASSWORD);

  return usernameMatch && passwordMatch;
}

/**
 * Creates a stateless signed session token
 */
export async function createAdminSession() {
  if (!ADMIN_SECRET) {
    throw new Error('ADMIN_SECRET not configured');
  }

  const payload = JSON.stringify({
    user: DEFAULT_ADMIN_USERNAME,
    exp: Date.now() + SESSION_DURATION_MS,
    iat: Date.now(),
  });
  
  const payloadB64 = Buffer.from(payload).toString('base64');
  const signature = sign(payloadB64);
  
  return `${payloadB64}.${signature}`;
}

/**
 * Validates the session token signature and expiration
 */
export async function validateAdminSession(token) {
  if (!token || typeof token !== 'string') return false;
  if (!ADMIN_SECRET) return false;
  
  // Check if token has been revoked (BUG-011)
  if (revokedTokens.has(token)) return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadB64, signature] = parts;
  
  // Verify signature using timing-safe comparison
  const expectedSignature = sign(payloadB64);
  if (!hmacEqual(signature, expectedSignature)) return false;
  
  // Verify expiration
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    // Check expiration
    if (Date.now() > payload.exp) return false;
    
    // Check issued at time (prevent token reuse from far past)
    if (payload.iat && Date.now() - payload.iat > SESSION_DURATION_MS * 2) {
      return false;
    }
    
    // Verify username still matches
    if (payload.user !== DEFAULT_ADMIN_USERNAME) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Invalidates session by adding token to server-side blocklist.
 * Token remains blocked until the cleanup interval removes expired entries.
 */
export async function invalidateAdminSession(token) {
  if (token && typeof token === 'string') {
    revokedTokens.add(token);
  }
  return true;
}

export function getDefaultAdminCredentials() {
  // Only return this in development
  if (process.env.NODE_ENV === 'production') {
    return {
      username: '***',
      password: '***',
    };
  }
  
  return {
    username: DEFAULT_ADMIN_USERNAME,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}

// Cleanup old login attempts and revoked tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    // Remove if lockout expired and no recent attempts
    if (record.blockedUntil && now > record.blockedUntil + ATTEMPT_WINDOW_MS) {
      loginAttempts.delete(ip);
    }
    // Remove if attempt window expired
    else if (now - record.firstAttempt > ATTEMPT_WINDOW_MS * 2) {
      loginAttempts.delete(ip);
    }
  }
  
  // Cleanup expired revoked tokens (older than session duration)
  for (const token of revokedTokens) {
    try {
      const parts = token.split('.');
      if (parts.length === 2) {
        const payload = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        if (payload.exp && now > payload.exp) {
          revokedTokens.delete(token);
        }
      }
    } catch {
      revokedTokens.delete(token); // Remove unparseable tokens
    }
  }
}, 10 * 60 * 1000);
