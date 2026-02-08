/**
 * React hook for identity management.
 *
 * Fetches current identity on mount, provides claim/rename helpers,
 * and auto-links guest identity to user account after login.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GroupIdentity {
  id: string;
  displayName: string;
  displayNameNorm: string;
  userId: string | null;
  guestId: string | null;
  lastRenamedAt: string | null;
}

export function useGroupIdentity() {
  const [identity, setIdentity] = useState<GroupIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  const fetchIdentity = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/identity/me');
      const json = await res.json();
      if (json.ok && json.data.identity) {
        setIdentity(json.data.identity);
        setClaimed(true);
      } else {
        setIdentity(null);
        setClaimed(false);
      }
    } catch {
      // Identity not claimed yet — that's OK
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-link identity after login
  const linkIdentity = useCallback(async () => {
    try {
      const res = await fetch('/api/identity/link', { method: 'POST' });
      const json = await res.json();
      if (json.ok && json.data.identity) {
        setIdentity(json.data.identity);
        setClaimed(true);
      }
    } catch {
      // Link failed — not critical
    }
  }, []);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const claimDisplayName = useCallback(
    async (displayName: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setError(null);
        const res = await fetch('/api/identity/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName }),
        });
        const json = await res.json();
        if (json.ok) {
          setIdentity(json.data.identity);
          setClaimed(true);
          // Auto-link if user is logged in
          await linkIdentity();
          return { success: true };
        }
        const msg = json.error?.message || 'Failed to claim display name';
        setError(msg);
        return { success: false, error: msg };
      } catch {
        const msg = 'Network error';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [linkIdentity]
  );

  const renameDisplayName = useCallback(
    async (displayName: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setError(null);
        const res = await fetch('/api/identity/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName }),
        });
        const json = await res.json();
        if (json.ok) {
          setIdentity((prev) =>
            prev ? { ...prev, ...json.data.identity } : json.data.identity
          );
          return { success: true };
        }
        const msg = json.error?.message || 'Failed to rename';
        setError(msg);
        return { success: false, error: msg };
      } catch {
        const msg = 'Network error';
        setError(msg);
        return { success: false, error: msg };
      }
    },
    []
  );

  return {
    identity,
    loading,
    error,
    claimed,
    claimDisplayName,
    renameDisplayName,
    linkIdentity,
    refetch: fetchIdentity,
  };
}
