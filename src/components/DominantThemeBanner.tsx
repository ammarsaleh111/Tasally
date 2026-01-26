'use client';

import { useTheme } from './ThemeProviderNew';
import Link from 'next/link';

/**
 * Global Theme Banner
 * Displays when a dominant theme is active and allowed by user preferences.
 * Shows theme name, end date, and learn more CTA.
 * Can be dismissed (hides for the day, does not disable theme).
 */
export default function DominantThemeBanner() {
  const { effectiveTheme, isBannerVisible, dismissBanner, isHydrated } = useTheme();
  
  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) return null;
  
  // Don't show if no banner should be visible
  if (!isBannerVisible || !effectiveTheme.banner) return null;
  
  const { banner, dominantId } = effectiveTheme;
  
  // Format the end date
  const endDate = new Date(banner.endDate);
  const formattedEndDate = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  
  return (
    <div
      className="relative w-full py-3 px-4 animate-slide-down"
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left spacer for desktop alignment */}
        <div className="hidden sm:block flex-shrink-0 w-20" />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-center">
          {/* Icon and title */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{banner.icon}</span>
            <span className="font-bold text-lg">{banner.title}</span>
          </div>
          
          {/* Subtitle and date */}
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span className="hidden sm:inline">•</span>
            <span>{banner.subtitle}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium">Until {formattedEndDate}</span>
          </div>
          
          {/* Learn more link */}
          <Link
            href="/themes"
            className="text-sm font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: banner.accentColor }}
          >
            Learn more →
          </Link>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={dismissBanner}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors"
          aria-label="Dismiss banner"
          title="Hide for today"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Compact banner variant for use in specific pages
 */
export function CompactThemeBanner() {
  const { effectiveTheme, isHydrated } = useTheme();
  
  if (!isHydrated) return null;
  if (!effectiveTheme.isDominantActive || !effectiveTheme.banner) return null;
  
  const { banner } = effectiveTheme;
  
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `${banner.backgroundColor}20`,
        color: banner.backgroundColor,
        border: `1px solid ${banner.backgroundColor}40`,
      }}
    >
      <span>{banner.icon}</span>
      <span>{banner.title} Active</span>
    </div>
  );
}
