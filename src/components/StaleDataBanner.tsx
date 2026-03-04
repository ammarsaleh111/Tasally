"use client";

/**
 * StaleDataBanner
 * Shows a subtle banner when data was served from cache while offline.
 * Checks for the X-Tasally-Stale header set by the service worker.
 */

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface StaleDataBannerProps {
  /** True when the data being displayed came from a stale cache */
  isStale: boolean;
  className?: string;
}

export default function StaleDataBanner({ isStale, className = "" }: StaleDataBannerProps) {
  const { isOnline } = useNetworkStatus();

  if (!isStale && isOnline) return null;

  return (
    <div
      className={`
        flex items-center gap-2 rounded-lg px-3 py-2
        text-xs font-medium
        bg-amber-500/10 text-amber-700 dark:text-amber-400
        border border-amber-500/20
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>
        {!isOnline
          ? "You're offline — showing cached data"
          : "This data may be outdated. Pull to refresh."}
      </span>
    </div>
  );
}

/**
 * Helper: check if a fetch Response has the stale marker header
 * (set by the service worker when serving from cache while offline).
 */
export function isStaleResponse(response: Response): boolean {
  return response.headers.get("X-Tasally-Stale") === "1";
}
