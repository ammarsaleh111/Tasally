/**
 * Secure localStorage Wrapper
 * 
 * Provides sanitized read/write operations to prevent:
 * - XSS via stored malicious data
 * - Script injection
 * - Data corruption
 */

import { sanitizeStorageData, isSafeInput } from './inputSanitizer';

/**
 * Safely get item from localStorage with sanitization
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - Sanitized value
 */
export function secureGetItem(key, defaultValue = null) {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }

    // Parse JSON
    const parsed = JSON.parse(item);
    
    // Sanitize before returning
    const sanitized = sanitizeStorageData(parsed);
    
    return sanitized;
  } catch (error) {
    console.warn(`[SecureStorage] Failed to get item "${key}":`, error.message);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage with sanitization
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} - True if successful
 */
export function secureSetItem(key, value) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Sanitize value before storing
    const sanitized = sanitizeStorageData(value);
    
    // Serialize
    const serialized = JSON.stringify(sanitized);
    
    // Additional safety check
    if (!isSafeInput(serialized)) {
      console.warn(`[SecureStorage] Blocked unsafe data for key "${key}"`);
      return false;
    }

    // Store
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[SecureStorage] Failed to set item "${key}":`, error.message);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} - True if successful
 */
export function secureRemoveItem(key) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[SecureStorage] Failed to remove item "${key}":`, error.message);
    return false;
  }
}

/**
 * Clear all localStorage (use with caution)
 * @returns {boolean} - True if successful
 */
export function secureClear() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.warn('[SecureStorage] Failed to clear storage:', error.message);
    return false;
  }
}

/**
 * Get all keys in localStorage
 * @returns {string[]} - Array of keys
 */
export function secureGetAllKeys() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return Object.keys(window.localStorage);
  } catch (error) {
    console.warn('[SecureStorage] Failed to get keys:', error.message);
    return [];
  }
}

/**
 * Validate and sanitize all existing localStorage data
 * Call this on app initialization to clean up any compromised data
 */
export function sanitizeAllStoredData() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keys = Object.keys(window.localStorage);
    let cleanedCount = 0;

    for (const key of keys) {
      try {
        const item = window.localStorage.getItem(key);
        if (!item) continue;

        const parsed = JSON.parse(item);
        const sanitized = sanitizeStorageData(parsed);
        const serialized = JSON.stringify(sanitized);

        // Only update if data changed
        if (serialized !== item) {
          if (isSafeInput(serialized)) {
            window.localStorage.setItem(key, serialized);
            cleanedCount++;
          } else {
            // Remove unsafe data entirely
            window.localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // If we can't parse/sanitize, remove it
        window.localStorage.removeItem(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SecureStorage] Sanitized ${cleanedCount} localStorage items`);
    }
  } catch (error) {
    console.warn('[SecureStorage] Failed to sanitize all data:', error.message);
  }
}

// Auto-sanitize on module load (client-side only)
if (typeof window !== 'undefined') {
  // Run sanitization after a short delay to not block initial render
  setTimeout(sanitizeAllStoredData, 1000);
}
