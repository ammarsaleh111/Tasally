'use client';

import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import IOSInstallModal from '@/components/IOSInstallModal';

export default function InstallAppHeaderButton() {
  const { isInstalled, isIOS, canInstall, triggerInstall } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (!hint) return;
    const timeout = window.setTimeout(() => setHint(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [hint]);

  // Hide if already installed
  if (isInstalled) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) {
      await triggerInstall();
      return;
    }

    setHint('Install becomes available after a short period of use.');
  };

  return (
    <>
      {/* Desktop: pill button with text */}
      <button
        onClick={handleClick}
        type="button"
        className="
          hidden md:inline-flex items-center gap-2
          px-3 py-1.5 rounded-full
          text-sm font-medium
          bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
          hover:opacity-90
          transition-all duration-200
          shadow-sm hover:shadow
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install App
      </button>

      {/* Mobile: compact icon button */}
      <button
        onClick={handleClick}
        type="button"
        className="
          md:hidden inline-flex items-center justify-center
          w-8 h-8 rounded-full
          bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
          hover:opacity-90
          transition-all duration-200
          shadow-sm
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
        "
        aria-label="Install App"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {hint && (
        <span className="hidden md:block text-xs text-[hsl(var(--muted-foreground))]" aria-live="polite">
          {hint}
        </span>
      )}

      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </>
  );
}
