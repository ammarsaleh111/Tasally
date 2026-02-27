'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIdentity } from '@/components/IdentityGate';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import NameGate from '@/components/onboarding/NameGate';
import TutorialFlow from '@/components/onboarding/TutorialFlow';
import InstallBanner from '@/components/onboarding/InstallBanner';

/**
 * OnboardingFlow — Sequential first-visit experience.
 *
 * Phase machine: idle → tutorial → install → done
 *
 * 1. IdentityGate (external) blocks until the user claims a display name.
 * 2. This component waits for identity + tutorial hydration.
 * 3. If the global tutorial hasn't been seen → opens it once.
 * 4. After tutorial closes → shows an install-app banner once (unless already installed).
 * 5. Marks everything as complete and never auto-shows again.
 */
export default function OnboardingFlow() {
  const [phase, setPhase] = useState('idle');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { identity } = useIdentity();
  const { isInstalled } = useInstallPrompt();
  const {
    hydrated,
    name,
    tutorialComplete,
    installShown,
    setName,
    setTutorialComplete,
    setInstallShown,
    setReturnTo,
    getReturnTo,
    clearReturnTo,
  } = useOnboardingState();

  const currentRoute = `${pathname || '/'}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
  const hasIdentityName = Boolean(identity?.displayName?.trim());
  const hasLocalName = Boolean(name?.trim());

  useEffect(() => {
    if (!hydrated) return;

    if ((!hasLocalName || !hasIdentityName || !tutorialComplete || !installShown) && currentRoute) {
      setReturnTo(currentRoute);
    }

    if (!hasLocalName || !hasIdentityName) {
      setPhase('name');
      return;
    }

    if (!tutorialComplete) {
      setPhase('tutorial');
      return;
    }

    if (!installShown && !isInstalled) {
      setPhase('install');
    } else {
      if (!installShown && isInstalled) {
        setInstallShown(true);
      }
      setPhase('done');
    }
  }, [
    hydrated,
    hasLocalName,
    hasIdentityName,
    tutorialComplete,
    installShown,
    isInstalled,
    currentRoute,
    setReturnTo,
    setInstallShown,
  ]);

  useEffect(() => {
    if (phase !== 'done' || !hydrated) return;
    const returnTo = getReturnTo();
    if (returnTo && returnTo !== currentRoute) {
      clearReturnTo();
      router.replace(returnTo);
      return;
    }
    clearReturnTo();
  }, [phase, hydrated, getReturnTo, clearReturnTo, currentRoute, router]);

  const completeInstallStep = useCallback(() => {
    setInstallShown(true);
    setPhase('done');
  }, [setInstallShown]);

  return (
    <>
      <NameGate
        nameStored={hasLocalName}
        onNameStored={(displayName) => {
          setName(displayName);
          setPhase('tutorial');
        }}
      />

      <TutorialFlow
        active={phase === 'tutorial'}
        onDone={() => {
          setTutorialComplete(true);
          setPhase('install');
        }}
      />

      <InstallBanner
        isOpen={phase === 'install'}
        onDone={completeInstallStep}
      />
    </>
  );
}
