'use client';

import React, { useEffect } from 'react';
import { initSessionTracking, trackPageLoad } from '@/utils/sessionTracker';

const SessionInitializer = ({ children }) => {
  useEffect(() => {
    // Initialize session tracking
    const cleanup = initSessionTracking();

    // Track navigation
    const handlePopState = () => {
      trackPageLoad(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (cleanup) cleanup();
    };
  }, []);

  return children;
};

export default SessionInitializer;
