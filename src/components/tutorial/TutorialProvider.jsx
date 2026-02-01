'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { secureGetItem, secureSetItem } from '@/utils/secureStorage';

const STORAGE_KEY = 'ammar-times-tutorials-v1';
const STORAGE_VERSION = 1;

const defaultState = {
  version: STORAGE_VERSION,
  seen: {},
  autoShown: {},
  lastStep: {},
};

const normalizeState = (stored) => {
  if (!stored || typeof stored !== 'object' || stored.version !== STORAGE_VERSION) {
    return { ...defaultState };
  }

  return {
    version: STORAGE_VERSION,
    seen: { ...(stored.seen || {}) },
    autoShown: { ...(stored.autoShown || {}) },
    lastStep: { ...(stored.lastStep || {}) },
  };
};

const TutorialContext = createContext(null);

export const TutorialProvider = ({ children }) => {
  const [state, setState] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeMode, setActiveMode] = useState('start');
  const activeIdRef = useRef(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const stored = secureGetItem(STORAGE_KEY, null);
    setState(normalizeState(stored));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    secureSetItem(STORAGE_KEY, state);
  }, [hydrated, state]);

  const openTutorial = useCallback((id, mode = 'start') => {
    if (!id) return false;
    if (activeIdRef.current && activeIdRef.current !== id) return false;
    setActiveId(id);
    setActiveMode(mode);
    return true;
  }, []);

  const closeTutorial = useCallback((id) => {
    if (!id) return;
    setActiveId((prev) => (prev === id ? null : prev));
    setActiveMode('start');
  }, []);

  const setSeen = useCallback((id, value = true) => {
    if (!id) return;
    setState((prev) => ({
      ...prev,
      seen: { ...prev.seen, [id]: value },
    }));
  }, []);

  const setAutoShown = useCallback((id, value = true) => {
    if (!id) return;
    setState((prev) => ({
      ...prev,
      autoShown: { ...prev.autoShown, [id]: value },
    }));
  }, []);

  const setLastStep = useCallback((id, step) => {
    if (!id || typeof step !== 'number') return;
    setState((prev) => ({
      ...prev,
      lastStep: { ...prev.lastStep, [id]: step },
    }));
  }, []);

  const value = {
    state,
    hydrated,
    activeId,
    activeMode,
    openTutorial,
    closeTutorial,
    setSeen,
    setAutoShown,
    setLastStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorialContext = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorialContext must be used within TutorialProvider');
  }
  return ctx;
};
