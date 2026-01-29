'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initSessionTracking, trackPageLoad, startHeartbeat, stopHeartbeat } from '@/utils/sessionTracker';
import { performDailyCleanup } from '@/utils/learningLogEngine';
import { ensureSession, getSession } from '@/utils/sessionManager';

const SessionInitializer = ({ children }) => {
  const pathname = usePathname();

  useEffect(() => {
    // Ensure there is a single active session identity
    ensureSession();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SESSION]', getSession());
    }

    // Initialize session tracking
    const cleanup = initSessionTracking();
    
    // Perform learning log daily cleanup on app startup
    // This ensures non-favorited words expire at the start of each new day
    performDailyCleanup();
    
    // Start real-time heartbeat for live admin tracking
    startHeartbeat();

    // Track navigation
    const handlePopState = () => {
      trackPageLoad(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopHeartbeat();
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    trackPageLoad(pathname);
  }, [pathname]);

  return children;
};

export default SessionInitializer;
