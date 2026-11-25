'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { lookupIdentity } from './identityLookup.mjs';
import ClaimDisplayNameModal from '@/components/groups/ClaimDisplayNameModal';
import { resultIdentityStorageKey, storeResultIdentity } from '@/utils/resultIdentity';

/**
 * Context for global identity state.
 */
const IdentityGateContext = createContext(null);

/**
 * Hook to access global identity state.
 */
export function useIdentity() {
  const ctx = useContext(IdentityGateContext);
  if (!ctx) {
    throw new Error('useIdentity must be used within IdentityGate');
  }
  return ctx;
}

/**
 * IdentityGate — Global provider that ensures every visitor has a display name.
 *
 * Features:
 *   - On first visit, shows modal to claim display name (supports Arabic)
 *   - Stores identity_id in httpOnly cookie for persistence
 *   - Auto-links guest identity to user account after login
 *   - Provides identity context to all children
 */
export default function IdentityGate({ children }) {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lookupFailed, setLookupFailed] = useState(false);

  // Fetch current identity on mount
  const fetchIdentity = useCallback(async () => {
    setLoading(true);
    const key = resultIdentityStorageKey();
    try {
      const currentIdentity = await lookupIdentity();
      storeResultIdentity(key, currentIdentity?.id ?? null);
      setIdentity(currentIdentity);
      setLookupFailed(false);
    } catch {
      setLookupFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Link identity after auth (called by SessionBridge or similar after login)
  const linkIdentity = useCallback(async () => {
    const key = resultIdentityStorageKey();
    try {
      const res = await fetch('/api/identity/link', { method: 'POST' });
      const json = await res.json();
      if (json.ok && json.data.identity) {
        storeResultIdentity(key, json.data.identity.id);
        setIdentity(json.data.identity);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  // Handle display name claim
  const handleClaim = async (displayName) => {
    const key = resultIdentityStorageKey();
    try {
      setError(null);
      const res = await fetch('/api/identity/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const json = await res.json();
      if (json.ok) {
        storeResultIdentity(key, json.data.identity.id);
        setIdentity(json.data.identity);
        // Auto-link if user is logged in
        await linkIdentity();
        return;
      }
      setError(json.error?.message || 'Failed to claim name');
    } catch {
      setError('Network error. Please try again.');
    }
  };

  // Handle rename (for settings page)
  const handleRename = async (displayName) => {
    try {
      setError(null);
      const res = await fetch('/api/identity/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const json = await res.json();
      if (json.ok) {
        setIdentity((prev) => (prev ? { ...prev, ...json.data.identity } : json.data.identity));
        return { success: true };
      }
      return { success: false, error: json.error?.message || 'Failed to rename' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const needsIdentity = !loading && !lookupFailed && !identity;

  return (
    <IdentityGateContext.Provider
      value={{
        identity,
        loading,
        lookupFailed,
        displayName: identity?.displayName ?? null,
        identityId: identity?.id ?? null,
        refetch: fetchIdentity,
        linkIdentity,
        rename: handleRename,
      }}
    >
      {/* Show claim modal if no identity */}
      {needsIdentity && <ClaimDisplayNameModal onClaim={handleClaim} error={error} />}

      {/* Render children regardless — modal is fixed overlay */}
      {children}
    </IdentityGateContext.Provider>
  );
}
