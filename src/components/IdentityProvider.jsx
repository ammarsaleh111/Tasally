'use client';

import React, { useState, useEffect } from 'react';
import NamePrompt from './NamePrompt';
import { hasSetName, getProfile } from '@/utils/profileManager';
import { syncProfile } from '@/utils/backendSync';
import { useAppSession } from '@/utils/sessionManager';

const IdentityProvider = ({ children }) => {
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const session = useAppSession();

  useEffect(() => {
    // Check if player has set their name
    const checkIdentity = () => {
      if (session?.role === 'ADMIN') {
        setShowNamePrompt(false);
        setIsLoaded(true);
        return;
      }

      const profile = getProfile();
      if (profile) {
        syncProfile(profile);
      }

      if (!session?.displayName && !hasSetName()) {
        setShowNamePrompt(true);
      } else {
        setShowNamePrompt(false);
      }
      setIsLoaded(true);
    };

    checkIdentity();
  }, [session?.role, session?.userId, session?.displayName]);

  const handleNameSet = () => {
    setShowNamePrompt(false);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      <NamePrompt isOpen={showNamePrompt} onNameSet={handleNameSet} />
      {children}
    </>
  );
};

export default IdentityProvider;
