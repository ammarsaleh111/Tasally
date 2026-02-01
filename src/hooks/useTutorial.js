'use client';

import { useCallback, useEffect } from 'react';
import { useTutorialContext } from '@/components/tutorial/TutorialProvider';

export const useTutorial = (id, options = {}) => {
  const {
    state,
    hydrated,
    activeId,
    activeMode,
    openTutorial,
    closeTutorial,
    setSeen,
    setAutoShown,
    setLastStep,
  } = useTutorialContext();

  const { auto = true } = options;

  const seen = Boolean(state.seen?.[id]);
  const autoShown = Boolean(state.autoShown?.[id]);
  const lastStep = Number.isFinite(state.lastStep?.[id]) ? state.lastStep[id] : 0;
  const isOpen = activeId === id;
  const startMode = isOpen ? activeMode : 'start';

  useEffect(() => {
    if (!auto || !hydrated) return;
    if (seen || autoShown) return;
    if (activeId) return;

    if (openTutorial(id, lastStep > 0 ? 'resume' : 'start')) {
      setAutoShown(id, true);
    }
  }, [auto, hydrated, seen, autoShown, activeId, id, openTutorial, lastStep, setAutoShown]);

  const openManual = useCallback(() => {
    openTutorial(id, 'start');
  }, [id, openTutorial]);

  const close = useCallback(() => {
    closeTutorial(id);
  }, [closeTutorial, id]);

  const complete = useCallback(() => {
    setSeen(id, true);
    closeTutorial(id);
  }, [id, setSeen, closeTutorial]);

  const skip = useCallback(() => {
    setSeen(id, true);
    closeTutorial(id);
  }, [id, setSeen, closeTutorial]);

  const updateStep = useCallback((step) => {
    setLastStep(id, step);
  }, [id, setLastStep]);

  return {
    isOpen,
    openManual,
    close,
    complete,
    skip,
    updateStep,
    startMode,
    lastStep,
    seen,
    hydrated,
  };
};
