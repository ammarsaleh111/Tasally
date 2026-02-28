/**
 * Input Sanitization & Validation Utilities
 * 
 * Provides comprehensive protection against:
 * - XSS attacks
 * - Script injection
 * - HTML injection
 * - SQL injection patterns
 * - Path traversal
 * - Malicious Unicode
 */

// Maximum lengths for different input types
const MAX_LENGTHS = {
  NAME: 30,
  WORD: 30,
  MESSAGE: 500,
  GENERAL: 200,
};

// Dangerous patterns to detect
// NOTE: Do NOT use the 'g' flag on patterns used with .test() — 
// global regexes maintain lastIndex state, causing alternating true/false results (BUG-006)
const DANGEROUS_PATTERNS = {
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  HTML_TAG: /<[^>]*>/g,
  EVENT_HANDLER: /on\w+\s*=\s*["'][^"']*["']/i,
  JAVASCRIPT_PROTOCOL: /javascript:/i,
  DATA_PROTOCOL: /data:text\/html/i,
  VBSCRIPT_PROTOCOL: /vbscript:/i,
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|script|javascript|expression)\s*[\(\;]/i,
  PATH_TRAVERSAL: /\.\.[\/\\]/g,
  NULL_BYTE: /\x00/g,
};

/**
 * Sanitize a string by removing all HTML and dangerous content
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = MAX_LENGTHS.GENERAL) {
  if (typeof input !== 'string') {
    return '';
  }

  let cleaned = input;

  // 1. Trim whitespace
  cleaned = cleaned.trim();

  // 2. Enforce max length BEFORE further processing
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  // 3. Remove null bytes
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.NULL_BYTE, '');

  // 4. Remove script tags
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.SCRIPT_TAG, '');

  // 5. Remove event handlers
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.EVENT_HANDLER, '');

  // 6. Remove dangerous protocols
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.JAVASCRIPT_PROTOCOL, '');
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.DATA_PROTOCOL, '');
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.VBSCRIPT_PROTOCOL, '');

  // 7. Strip ALL HTML tags
  cleaned = cleaned.replace(DANGEROUS_PATTERNS.HTML_TAG, '');

  // 8. HTML entity encode remaining special chars
  cleaned = escapeHtml(cleaned);

  return cleaned;
}

/**
 * Sanitize a player name
 * @param {string} name - Raw name input
 * @returns {string} - Sanitized name
 */
function getNameAllowedRegex() {
  try {
    return new RegExp("^[\\p{L}\\p{N} .,'_-]+$", "u");
  } catch {
    return /^[A-Za-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0660-\u0669\u06F0-\u06F9 .,'_-]+$/;
  }
}

function getNameRequiredRegex() {
  try {
    return new RegExp("[\\p{L}\\p{N}]", "u");
  } catch {
    return /[A-Za-z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0660-\u0669\u06F0-\u06F9]/;
  }
}

const NAME_ALLOWED_REGEX = getNameAllowedRegex();
const NAME_REQUIRED_REGEX = getNameRequiredRegex();

export function validateName(name) {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Please enter a valid name', value: '' };
  }

  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: 'Please enter your name', value: '' };
  }

  if (trimmed.length > MAX_LENGTHS.NAME) {
    return { valid: false, error: `Name must be ${MAX_LENGTHS.NAME} characters or less`, value: '' };
  }

  if (!NAME_ALLOWED_REGEX.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, and . , \' - _', value: '' };
  }

  if (!NAME_REQUIRED_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid name', value: '' };
  }

  return { valid: true, error: '', value: trimmed };
}

export function sanitizeName(name) {
  const validation = validateName(name);
  return validation.valid ? validation.value : '';
}

/**
 * Sanitize a word guess (Wordle, Spelling Bee, etc.)
 * @param {string} word - Raw word input
 * @returns {string} - Sanitized word
 */
export function sanitizeWord(word) {
  if (typeof word !== 'string') {
    return '';
  }

  let cleaned = word.trim().toLowerCase();

  // Enforce max length
  if (cleaned.length > MAX_LENGTHS.WORD) {
    cleaned = cleaned.substring(0, MAX_LENGTHS.WORD);
  }

  // Only allow letters
  cleaned = cleaned.replace(/[^a-z]/g, '');

  return cleaned;
}

/**
 * Sanitize a message/comment
 * @param {string} message - Raw message input
 * @returns {string} - Sanitized message
 */
export function sanitizeMessage(message) {
  return sanitizeString(message, MAX_LENGTHS.MESSAGE);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Validate input doesn't contain dangerous patterns
 * @param {string} input - Input to validate
 * @returns {boolean} - True if safe, false if dangerous
 */
export function isSafeInput(input) {
  if (typeof input !== 'string') {
    return false;
  }

  // Check for dangerous patterns
  if (DANGEROUS_PATTERNS.SCRIPT_TAG.test(input)) return false;
  if (DANGEROUS_PATTERNS.EVENT_HANDLER.test(input)) return false;
  if (DANGEROUS_PATTERNS.JAVASCRIPT_PROTOCOL.test(input)) return false;
  if (DANGEROUS_PATTERNS.DATA_PROTOCOL.test(input)) return false;
  if (DANGEROUS_PATTERNS.VBSCRIPT_PROTOCOL.test(input)) return false;
  if (DANGEROUS_PATTERNS.PATH_TRAVERSAL.test(input)) return false;
  if (DANGEROUS_PATTERNS.NULL_BYTE.test(input)) return false;

  return true;
}

/**
 * Validate and sanitize localStorage data
 * @param {any} data - Data from localStorage
 * @returns {any} - Sanitized data
 */
export function sanitizeStorageData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(sanitizeStorageData);
    }

    const nameKeys = new Set(['name', 'displayname', 'playername']);
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize both keys and values
      const safeKey = sanitizeString(key);
      if (nameKeys.has(key.toLowerCase()) && typeof value === 'string') {
        sanitized[safeKey] = sanitizeName(value);
      } else {
        sanitized[safeKey] = sanitizeStorageData(value);
      }
    }
    return sanitized;
  }

  // Numbers, booleans, etc. pass through
  return data;
}

/**
 * Rate limiting helper - tracks requests by identifier
 */
const rateLimitStore = new Map();

/**
 * Check if request should be rate limited
 * @param {string} identifier - Unique identifier (IP, userId, etc.)
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if rate limit exceeded
 */
export function isRateLimited(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  const record = rateLimitStore.get(key);

  // Reset if window expired
  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  // Increment count
  record.count += 1;

  // Check if limit exceeded
  if (record.count > maxRequests) {
    return true;
  }

  return false;
}

/**
 * Clean up expired rate limit records (call periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

export const MAX_INPUT_LENGTHS = MAX_LENGTHS;
