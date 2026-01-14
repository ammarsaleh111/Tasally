'use client';

import React, { useEffect } from 'react';
import { initSessionTracking, trackPageLoad, startHeartbeat, stopHeartbeat } from '@/utils/sessionTracker';
import { performDailyCleanup } from '@/utils/learningLogEngine';

const SessionInitializer = ({ children }) => {
  useEffect(() => {
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

  return children;
};

export default SessionInitializer;
