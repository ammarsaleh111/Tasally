'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { lookupIdentity } from './identityLookup.mjs';
import { resultIdentityStorageKey, storeResultIdentity } from '@/utils/resultIdentity';
import { getSession, updateSession, useAppSession } from '@/utils/sessionManager';

const IdentityGateContext = createContext(null);

export function useIdentity() {
  return useContext(IdentityGateContext);
}

export default function IdentityGate({ children }) {
  const session = useAppSession();
  const owner = session?.userId;
  const role = session?.role;
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (!owner || role === 'ADMIN') return;
    let active = true;
    let pending = false;
    let retry;
    let delay = 2000;
    const key = resultIdentityStorageKey();

    async function initialize() {
      if (!active || pending || !navigator.onLine) return;
      clearTimeout(retry);
      pending = true;
      try {
        // Two new tabs share a cookie. Finish the first response before the second request.
        const load = () => active ? lookupIdentity() : null;
        const identity = navigator.locks
          ? await navigator.locks.request('tasally-player', load)
          : await load();
        if (!active || key !== resultIdentityStorageKey() || !identity) return;
        if ((identity.userId ?? null) !== (role === 'USER' ? owner : null)) return;
        storeResultIdentity(key, identity.id);
        if (getSession()?.displayName !== identity.displayName) updateSession({ displayName: identity.displayName });
        setPlayer({ owner, role, identity });
        window.removeEventListener('online', initialize);
      } catch {
        if (active) {
          retry = setTimeout(initialize, delay);
          delay = Math.min(delay * 2, 60000);
        }
      } finally {
        pending = false;
      }
    }

    void initialize();
    window.addEventListener('online', initialize);
    return () => {
      active = false;
      clearTimeout(retry);
      window.removeEventListener('online', initialize);
    };
  }, [owner, role]);

  const identity = player?.owner === owner && player?.role === role ? player?.identity : null;
  return <IdentityGateContext.Provider value={{ identity }}>{children}</IdentityGateContext.Provider>;
}
