'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from './ThemeProviderNew';

/**
 * SeasonDecorations Component
 * 
 * Renders the visual identity pack for the current season/dominant theme:
 * - Background pattern layer (subtle repeating SVG)
 * - Corner decorations (positioned in 4 corners)
 * 
 * All visuals are applied via CSS variables set on [data-season] and [data-dominant],
 * making this component lightweight and performant.
 */

// For SSR-safe mounting detection
const subscribeMount = () => () => {};
const getSnapshotMount = () => true;
const getServerSnapshotMount = () => false;

// For reduced motion preference
function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getSnapshotReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshotReducedMotion() {
  return false;
}

export default function SeasonDecorations() {
  const { season, dominantId } = useTheme();
  const mounted = useSyncExternalStore(subscribeMount, getSnapshotMount, getServerSnapshotMount);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getSnapshotReducedMotion,
    getServerSnapshotReducedMotion
  );
  
  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }
  
  // Only show decorations if a season or dominant theme is active
  const hasDecorations = season || dominantId;
  
  if (!hasDecorations) {
    return null;
  }
  
  return (
    <>
      {/* Background Pattern Layer */}
      <div
        className={`season-pattern-layer ${!reducedMotion ? 'season-ambient' : ''}`}
        aria-hidden="true"
      />
      
      {/* Corner Decorations - Only on larger screens */}
      <div className="hidden md:block">
        <div className="season-corner season-corner--tl" aria-hidden="true" />
        <div className="season-corner season-corner--tr" aria-hidden="true" />
        <div className="season-corner season-corner--bl" aria-hidden="true" />
        <div className="season-corner season-corner--br" aria-hidden="true" />
      </div>
    </>
  );
}

/**
 * SeasonCard Component
 * Use this to wrap cards that should have season-specific corner decorations
 */
export function SeasonCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`season-card ${className}`}>
      {children}
    </div>
  );
}

/**
 * SeasonBorder Component
 * Use this to apply season-specific border colors
 */
export function SeasonBorder({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`season-border ${className}`}>
      {children}
    </div>
  );
}
