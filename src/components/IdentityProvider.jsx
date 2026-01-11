'use client';

import React, { useState, useEffect } from 'react';
import NamePrompt from './NamePrompt';
import { hasSetName, getProfile } from '@/utils/profileManager';
import { syncProfile } from '@/utils/backendSync';

const IdentityProvider = ({ children }) => {
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if player has set their name
    const checkIdentity = () => {
      const profile = getProfile();
      if (profile) {
        syncProfile(profile);
      }

      if (!hasSetName()) {
        setShowNamePrompt(true);
      }
      setIsLoaded(true);
    };

    checkIdentity();
  }, []);

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
