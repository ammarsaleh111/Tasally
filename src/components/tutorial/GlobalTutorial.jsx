'use client';

import React from 'react';
import TutorialPanel from '@/components/tutorial/TutorialPanel';
import { GLOBAL_TUTORIAL } from '@/data/tutorials';
import { useTutorial } from '@/hooks/useTutorial';

const GlobalTutorial = () => {
  const {
    isOpen,
    close,
    skip,
    complete,
    updateStep,
    startMode,
    lastStep,
  } = useTutorial(GLOBAL_TUTORIAL.id, { auto: true });

  return (
    <TutorialPanel
      isOpen={isOpen}
      tutorial={GLOBAL_TUTORIAL}
      startAt={startMode === 'resume' ? lastStep : 0}
      resumeStep={lastStep}
      onStepChange={updateStep}
      onClose={close}
      onSkip={skip}
      onComplete={complete}
    />
  );
};

export default GlobalTutorial;
