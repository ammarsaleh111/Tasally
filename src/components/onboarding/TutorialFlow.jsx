'use client';

import { useEffect, useRef } from 'react';
import { GLOBAL_TUTORIAL } from '@/data/tutorials';
import { useTutorial } from '@/hooks/useTutorial';

export default function TutorialFlow({ active, onDone }) {
  const opened = useRef(false);
  const confirmed = useRef(false);

  const {
    openManual,
    isOpen,
    seen,
    hydrated,
  } = useTutorial(GLOBAL_TUTORIAL.id, { auto: false });

  useEffect(() => {
    if (!active || !hydrated || seen) return;
    if (opened.current) return;
    opened.current = true;
    openManual();
  }, [active, hydrated, seen, openManual]);

  useEffect(() => {
    if (!active || !opened.current || confirmed.current) return;
    if (isOpen) confirmed.current = true;
  }, [active, isOpen]);

  useEffect(() => {
    if (!active || !confirmed.current) return;
    if (isOpen) return;
    onDone();
  }, [active, isOpen, onDone]);

  return null;
}
