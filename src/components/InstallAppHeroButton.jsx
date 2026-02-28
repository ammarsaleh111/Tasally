'use client';

import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import IOSInstallModal from '@/components/IOSInstallModal';

export default function InstallAppHeroButton() {
  const { isInstalled, isIOS, canInstall, triggerInstall } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [hint, setHint] = useState('');
  // Avoid SSR hydration mismatch — only show after client hydration
  const [mounted, setMounted] = useState(false);

  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  useEffect(() => {
    if (!hint) return;
    const timeout = window.setTimeout(() => setHint(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [hint]);

  // Don't render until hydrated, or if already installed
  if (!mounted || isInstalled) return null;

  // Don't show button at all if there's no install mechanism available
  if (!canInstall && !isIOS) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) {
      const outcome = await triggerInstall();
      if (outcome === 'dismissed') {
        setHint('You can install the app anytime from your browser menu.');
      }
      return;
    }
  };

  return (
    // Use fixed positioning so the button is never clipped by overflow-hidden parents
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="
          group flex items-center gap-2 px-4 py-2.5
          bg-[hsl(var(--card))]/80 backdrop-blur-md
          border border-[hsl(var(--border))]
          text-[hsl(var(--foreground))]
          rounded-full font-medium text-sm
          shadow-lg shadow-black/5
          hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]
          hover:border-[hsl(var(--primary))]
          hover:-translate-y-0.5 hover:shadow-xl
          active:scale-95
          transition-all duration-300
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="hidden sm:inline">
          {isIOS ? 'Add to Home Screen' : 'Install App'}
        </span>
      </button>

      {hint && (
        <div className="
          px-3 py-2 rounded-lg max-w-[220px] text-right
          bg-[hsl(var(--card))] border border-[hsl(var(--border))]
          text-xs text-[hsl(var(--muted-foreground))]
          shadow-lg animate-in fade-in slide-in-from-top-2
        " aria-live="polite">
          {hint}
        </div>
      )}

      <IOSInstallModal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)} />
    </div>
  );
}
