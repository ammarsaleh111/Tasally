import crypto from 'crypto';

// Environment-based credentials - MUST be set in production
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SecureAdmin#2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ammar-times-admin-secret-key-change-in-prod';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 hours

// Brute force protection
const loginAttempts = new Map(); // IP -> { count, firstAttempt, blockedUntil }
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

// Timing-safe string comparison
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }

  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
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
  // Input validation
  if (typeof username !== 'string' || typeof password !== 'string') {
    return false;
  }

  if (username.length > 100 || password.length > 100) {
    return false;
  }

  // Strip any potential XSS/injection attempts
  const cleanUsername = username.trim();
  const cleanPassword = password.trim();

  // Timing-safe comparison
  const usernameMatch = timingSafeEqual(cleanUsername, DEFAULT_ADMIN_USERNAME);
  const passwordMatch = timingSafeEqual(cleanPassword, DEFAULT_ADMIN_PASSWORD);

  return usernameMatch && passwordMatch;
}

/**
 * Creates a stateless signed session token
 */
export async function createAdminSession() {
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
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadB64, signature] = parts;
  
  // Verify signature using timing-safe comparison
  const expectedSignature = sign(payloadB64);
  if (!timingSafeEqual(signature, expectedSignature)) return false;
  
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
 * Invalidates session - client side just deletes cookie.
 * No server-side state to clear.
 */
export async function invalidateAdminSession(token) {
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

// Cleanup old login attempts every 10 minutes
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
}, 10 * 60 * 1000);
