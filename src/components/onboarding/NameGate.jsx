'use client';

import { useEffect } from 'react';
import { useIdentity } from '@/components/IdentityGate';

export default function NameGate({ nameStored, onNameStored }) {
  const { identity } = useIdentity();

  useEffect(() => {
    if (!identity?.displayName) return;
    if (nameStored) return;
    onNameStored(identity.displayName);
  }, [identity, nameStored, onNameStored]);

  return null;
}
