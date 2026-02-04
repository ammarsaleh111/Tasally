'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

/**
 * Presence Provider Component
 * 
 * Wraps your app to enable presence tracking for authenticated users.
 * Sends heartbeats every 90 seconds (configurable) to track online status.
 * 
 * Usage:
 *   // In your app's root layout.js:
 *   import PresenceProvider from '@/components/PresenceProvider';
 *   
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <SessionProvider>
 *             <PresenceProvider>
 *               {children}
 *             </PresenceProvider>
 *           </SessionProvider>
 *         </body>
 *       </html>
 *     );
 *   }
 */

interface PresenceContextValue {
  /** Manually trigger a heartbeat */
  sendHeartbeat: () => Promise<void>;
  /** Whether heartbeat is currently active */
  isActive: boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

interface PresenceProviderProps {
  children: ReactNode;
  /** Heartbeat interval in milliseconds (default: 90000 = 90s) */
  intervalMs?: number;
}

export function PresenceProvider({ children, intervalMs = 90000 }: PresenceProviderProps) {
  const { sendHeartbeat, isActive } = usePresenceHeartbeat({
    intervalMs,
    sendInitial: true,
    onError: (error) => {
      // Log but don't crash - presence is non-critical
      console.warn('[PresenceProvider] Heartbeat error:', error.message);
    },
  });

  return (
    <PresenceContext.Provider value={{ sendHeartbeat, isActive }}>
      {children}
    </PresenceContext.Provider>
  );
}

/**
 * Hook to access presence context
 * Returns null if used outside PresenceProvider
 */
export function usePresence(): PresenceContextValue | null {
  return useContext(PresenceContext);
}

export default PresenceProvider;
