'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';

const VERSION = 'v1';

const KEY_NAME = `ammar:onboarding:${VERSION}:name`;
const KEY_TUTORIAL = `ammar:onboarding:${VERSION}:tutorialComplete`;
const KEY_INSTALL = `ammar:onboarding:${VERSION}:installShown`;
const KEY_RETURN_TO = `ammar:onboarding:${VERSION}:returnTo`;

const LEGACY_KEY_TUTORIAL = 'ammarTimes:onboarding:v1:tutorialCompleted';
const LEGACY_KEY_INSTALL = 'ammarTimes:onboarding:v1:installPromptShown';

const readBool = (value) => value === 'true';

const readInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      name: '',
      tutorialComplete: false,
      installShown: false,
    };
  }

  return {
    name: localStorage.getItem(KEY_NAME) || '',
    tutorialComplete:
      readBool(localStorage.getItem(KEY_TUTORIAL)) ||
      readBool(localStorage.getItem(LEGACY_KEY_TUTORIAL)),
    installShown:
      readBool(localStorage.getItem(KEY_INSTALL)) ||
      readBool(localStorage.getItem(LEGACY_KEY_INSTALL)),
  };
};

export function useOnboardingState() {
  // Initialize with safe defaults to prevent hydration mismatch (BUG-044)
  // localStorage values are loaded in the useEffect below after hydration
  const [hydrated, setHydrated] = useState(false);
  const [name, setNameState] = useState('');
  const [tutorialComplete, setTutorialCompleteState] = useState(false);
  const [installShown, setInstallShownState] = useState(false);

  useEffect(() => {
    // Read from localStorage after mount to avoid SSR hydration mismatch
    const initial = readInitialState();
    setNameState(initial.name);
    setTutorialCompleteState(initial.tutorialComplete);
    setInstallShownState(initial.installShown);
    setHydrated(true);
  }, []);

  const setName = useCallback((value) => {
    const trimmed = String(value || '').trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_NAME, trimmed);
    }
    setNameState(trimmed);
  }, []);

  const setTutorialComplete = useCallback((value = true) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_TUTORIAL, value ? 'true' : 'false');
    }
    setTutorialCompleteState(Boolean(value));
  }, []);

  const setInstallShown = useCallback((value = true) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY_INSTALL, value ? 'true' : 'false');
    }
    setInstallShownState(Boolean(value));
  }, []);

  const setReturnTo = useCallback((path) => {
    if (typeof window === 'undefined') return;
    if (!path) return;
    sessionStorage.setItem(KEY_RETURN_TO, path);
  }, []);

  const getReturnTo = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(KEY_RETURN_TO) || '';
  }, []);

  const clearReturnTo = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(KEY_RETURN_TO);
  }, []);

  const isComplete = useMemo(() => {
    return Boolean(name) && tutorialComplete && installShown;
  }, [name, tutorialComplete, installShown]);

  return {
    hydrated,
    name,
    tutorialComplete,
    installShown,
    isComplete,
    setName,
    setTutorialComplete,
    setInstallShown,
    setReturnTo,
    getReturnTo,
    clearReturnTo,
    keys: {
      name: KEY_NAME,
      tutorial: KEY_TUTORIAL,
      install: KEY_INSTALL,
      returnTo: KEY_RETURN_TO,
    },
  };
}
