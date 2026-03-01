'use client';

import { useCallback, useEffect, useState } from 'react';
import IOSInstallModal from '@/components/IOSInstallModal';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function InstallBanner({ isOpen, onDone }) {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { isInstalled, isIOS, canInstall, triggerInstall } = useInstallPrompt();

  useEffect(() => {
    if (!isOpen || !isInstalled) return;
    onDone();
  }, [isOpen, isInstalled, onDone]);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!canInstall) return;

    await triggerInstall();
    onDone();
  }, [isIOS, canInstall, triggerInstall, onDone]);

  if (!isOpen) {
    return (
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    );
  }

  return (
    <>
      <div
        role="banner"
        aria-label="Install Tasally app"
        className="fixed top-0 left-0 right-0 z-[100] px-3 pt-3 pb-1 sm:px-4 sm:pt-4 animate-in slide-in-from-top duration-300"
      >
        <div className="max-w-2xl mx-auto bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-2xl rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 grid grid-cols-2 gap-0.5 size-10 rounded-xl overflow-hidden mt-0.5"
              aria-hidden="true"
            >
              <span className="bg-[hsl(var(--success))]" />
              <span className="bg-[hsl(var(--warning))]" />
              <span className="bg-[hsl(var(--info))]" />
              <span className="bg-[hsl(var(--accent))]" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[hsl(var(--foreground))] text-sm sm:text-base leading-snug">
                Install Tasally
              </h3>
              <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">
                {isIOS
                  ? 'Install from Safari: tap Share, then Add to Home Screen.'
                  : canInstall
                    ? 'Install Tasally for faster access and an app-like experience.'
                    : 'Install unlocks after a short period of use. Try again in a moment.'}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(isIOS || canInstall) && (
                  <button
                    onClick={handleInstall}
                    className="
                      px-4 py-1.5 rounded-lg text-sm font-semibold
                      bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]
                      hover:opacity-90 active:scale-95
                      transition-all duration-150
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
                    "
                  >
                    {isIOS ? 'How to install' : 'Install'}
                  </button>
                )}

                <button
                  onClick={onDone}
                  className="
                    px-4 py-1.5 rounded-lg text-sm font-medium
                    text-[hsl(var(--muted-foreground))]
                    hover:text-[hsl(var(--foreground))]
                    hover:bg-[hsl(var(--surface-hover))]
                    transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
                  "
                >
                  Not now
                </button>
              </div>
            </div>

            <button
              onClick={onDone}
              className="
                shrink-0 p-1.5 rounded-full
                text-[hsl(var(--muted-foreground))]
                hover:text-[hsl(var(--foreground))]
                hover:bg-[hsl(var(--surface-hover))]
                transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
              "
              aria-label="Dismiss install prompt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => {
          setShowIOSModal(false);
          onDone();
        }}
      />
    </>
  );
}
