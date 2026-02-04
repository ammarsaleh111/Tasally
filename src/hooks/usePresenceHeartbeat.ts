'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Presence Heartbeat Hook
 * 
 * Sends periodic heartbeats to /api/presence/heartbeat to track online status.
 * 
 * Features:
 * - Configurable interval (60-120 seconds)
 * - Pauses when tab is hidden (visibility API)
 * - Resumes and sends immediate heartbeat on visibility change
 * - Singleton pattern (only one timer per app)
 * - Auth required (only sends for authenticated users)
 * 
 * Usage:
 *   // In your app's root layout or provider:
 *   function AppShell({ children }) {
 *     usePresenceHeartbeat();
 *     return <>{children}</>;
 *   }
 */

// Default interval: 90 seconds (in the 60-120s range)
const DEFAULT_INTERVAL_MS = 90 * 1000;

// Minimum interval to prevent spam
const MIN_INTERVAL_MS = 60 * 1000;

// Global flag to ensure only one heartbeat timer runs
let globalHeartbeatActive = false;

interface UsePresenceHeartbeatOptions {
  /** Heartbeat interval in milliseconds (default: 90000 = 90s) */
  intervalMs?: number;
  /** Whether to send initial heartbeat immediately (default: true) */
  sendInitial?: boolean;
  /** Callback on heartbeat success */
  onSuccess?: (response: { ok: boolean; serverTime: string }) => void;
  /** Callback on heartbeat error */
  onError?: (error: Error) => void;
}

export function usePresenceHeartbeat(options: UsePresenceHeartbeatOptions = {}) {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    sendInitial = true,
    onSuccess,
    onError,
  } = options;

  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const lastSentRef = useRef<number>(0);

  // Ensure interval is not too frequent
  const safeInterval = Math.max(intervalMs, MIN_INTERVAL_MS);

  const sendHeartbeat = useCallback(async () => {
    // Only send if authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    // Debounce: don't send if we sent recently
    const now = Date.now();
    if (now - lastSentRef.current < MIN_INTERVAL_MS) {
      return;
    }

    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie
      });

      if (response.ok) {
        const data = await response.json();
        lastSentRef.current = now;
        onSuccess?.(data);
      } else if (response.status === 429) {
        // Rate limited - just wait for next interval
        console.debug('[Presence] Rate limited, will retry later');
      } else {
        throw new Error(`Heartbeat failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('[Presence] Heartbeat error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [session?.user?.id, status, onSuccess, onError]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const wasHidden = !isVisibleRef.current;
    isVisibleRef.current = !document.hidden;

    if (isVisibleRef.current && wasHidden) {
      // Tab became visible - send heartbeat immediately
      sendHeartbeat();
    }
  }, [sendHeartbeat]);

  useEffect(() => {
    // Don't start if not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    // Singleton pattern - only one heartbeat timer per app
    if (globalHeartbeatActive) {
      console.debug('[Presence] Heartbeat already active, skipping');
      return;
    }

    globalHeartbeatActive = true;

    // Send initial heartbeat
    if (sendInitial) {
      sendHeartbeat();
    }

    // Start interval timer
    intervalRef.current = setInterval(() => {
      // Only send if tab is visible
      if (isVisibleRef.current) {
        sendHeartbeat();
      }
    }, safeInterval);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      globalHeartbeatActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session?.user?.id, status, safeInterval, sendInitial, sendHeartbeat, handleVisibilityChange]);

  // Return methods for manual control if needed
  return {
    sendHeartbeat,
    isActive: globalHeartbeatActive,
  };
}

export default usePresenceHeartbeat;
