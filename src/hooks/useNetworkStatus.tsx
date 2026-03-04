"use client";

/**
 * useNetworkStatus — Online / Offline detection hook
 * ─────────────────────────────────────────────────────────
 * Provides a React context + hook that tracks connectivity
 * and automatically processes the offline queue when the
 * device comes back online.
 * ─────────────────────────────────────────────────────────
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { processQueue, getQueueSize, subscribeQueue } from "@/utils/offlineSyncQueue";
import { reconcile } from "@/utils/syncReconciler";

interface NetworkStatusValue {
  /** True when the browser reports connectivity */
  isOnline: boolean;
  /** True when we are actively draining the queue */
  isSyncing: boolean;
  /** Number of entries waiting to sync */
  pendingCount: number;
  /** Brief flash (2.5 s) after a sync drain completes */
  showSyncedFlash: boolean;
  /** True when device just came back online (auto-clears after 3 s) */
  showReconnected: boolean;
  /** Manually trigger a queue drain */
  triggerSync: () => Promise<void>;
}

const NetworkStatusContext = createContext<NetworkStatusValue>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  showSyncedFlash: false,
  showReconnected: false,
  triggerSync: async () => {},
});

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showSyncedFlash, setShowSyncedFlash] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const syncingRef = useRef(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  // Refresh the pending count
  const refreshCount = useCallback(async () => {
    const count = await getQueueSize();
    setPendingCount(count);
  }, []);

  // Drain the offline queue and run reconciliation
  const triggerSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const synced = await processQueue();
      // Run full reconciliation (push remaining + pull + merge)
      try {
        await reconcile();
      } catch {
        // Non-fatal — reconcile failure shouldn't block UI
      }
      // Flash "synced" indicator briefly when items were drained
      if (synced > 0) {
        setShowSyncedFlash(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setShowSyncedFlash(false), 2500);
      }
    } catch {
      // Ignore — individual entries handle their own errors
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  // Listen to browser online/offline events
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Show reconnect toast if we were offline
      if (wasOfflineRef.current) {
        setShowReconnected(true);
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => setShowReconnected(false), 3000);
      }
      wasOfflineRef.current = false;
      // Small delay so the network stack is ready
      setTimeout(() => triggerSync(), 1500);
    };
    const goOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Initial count
    refreshCount();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [triggerSync, refreshCount]);

  // Subscribe to queue changes so pending count stays fresh
  useEffect(() => {
    return subscribeQueue(() => {
      refreshCount();
    });
  }, [refreshCount]);

  return (
    <NetworkStatusContext.Provider
      value={{ isOnline, isSyncing, pendingCount, showSyncedFlash, showReconnected, triggerSync }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
}
