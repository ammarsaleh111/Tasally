'use client';

import { useState, useEffect } from 'react';

/**
 * Simple hook for initial page load animation
 * Shows loader for ~1 second on mount, then fades out
 */
export function useSimplePuzzleLoader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loader for minimum 800ms for smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  return isLoading;
}
