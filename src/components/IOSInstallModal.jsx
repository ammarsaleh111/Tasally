'use client';

/**
 * IOSInstallModal — shared modal explaining how to install on iOS.
 * Used by InstallAppHeaderButton, InstallAppHeroButton, and OnboardingFlow.
 */

export default function IOSInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
            Install on iOS
          </h3>
          <button
            onClick={onClose}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] p-1 rounded-full hover:bg-[hsl(var(--surface-hover))] transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-[hsl(var(--muted-foreground))]">
          <p>To install Ammar Times on your device:</p>
          <ol className="space-y-3 ml-1">
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold">1</span>
              <span>
                Tap the{' '}
                <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 dark:bg-gray-800 rounded text-blue-500 align-middle mx-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{' '}
                <strong>Share</strong> button in Safari
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold">2</span>
              <span>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold">3</span>
              <span>Tap <strong>&quot;Add&quot;</strong> in the top right</span>
            </li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
