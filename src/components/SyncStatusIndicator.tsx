"use client";

/**
 * Sync Status Indicator
 * ─────────────────────────────────────────────────────────
 * Floating pill that shows offline / syncing / synced state.
 * Hidden when online with nothing to sync.
 *
 * Derives visual state entirely from the NetworkStatus context
 * plus a `showSyncedFlash` flag exposed by the provider.
 * ─────────────────────────────────────────────────────────
 */

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type VisualState = "hidden" | "offline" | "syncing" | "synced" | "reconnected";

export default function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, showSyncedFlash, showReconnected } = useNetworkStatus();

  const state: VisualState = useMemo(() => {
    if (!isOnline) return "offline";
    if (isSyncing || pendingCount > 0) return "syncing";
    if (showSyncedFlash) return "synced";
    if (showReconnected) return "reconnected";
    return "hidden";
  }, [isOnline, isSyncing, pendingCount, showSyncedFlash, showReconnected]);

  return (
    <AnimatePresence>
      {state !== "hidden" && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]"
        >
          <div
            className={`
              flex items-center gap-2 rounded-full px-4 py-2 shadow-lg
              text-sm font-medium backdrop-blur-md
              ${state === "offline"
                ? "bg-amber-500/90 text-amber-950"
                : state === "syncing"
                  ? "bg-blue-500/90 text-white"
                  : state === "reconnected"
                    ? "bg-sky-500/90 text-white"
                    : "bg-emerald-500/90 text-emerald-950"
              }
            `}
          >
            {/* Icon */}
            {state === "offline" && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            )}
            {state === "syncing" && (
              <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {state === "synced" && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {state === "reconnected" && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
              </svg>
            )}

            {/* Label */}
            <span>
              {state === "offline" && (
                <>Playing offline{pendingCount > 0 ? ` · ${pendingCount} pending` : ""}</>
              )}
              {state === "syncing" && (
                <>Syncing{pendingCount > 0 ? ` ${pendingCount} result${pendingCount > 1 ? "s" : ""}…` : "…"}</>
              )}
              {state === "synced" && "All synced ✓"}
              {state === "reconnected" && "Back online"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
