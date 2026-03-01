'use client';

/**
 * PWAInstallButton
 * ─────────────────────────────────────────────────────────
 * Appears only when the browser fires the beforeinstallprompt event
 * (i.e., when the PWA install criteria are met on Android Chrome / Edge).
 * Clicking it triggers the browser's native install prompt.
 * The button disappears after the user installs or dismisses.
 *
 * Positioning: fixed pill at the bottom-right, uses design system tokens.
 * ─────────────────────────────────────────────────────────
 */
import { useEffect, useRef, useState } from 'react';

export default function PWAInstallButton() {
  const [showBanner, setShowBanner] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the default mini-infobar on mobile
      e.preventDefault();
      deferredPrompt.current = e;
      setShowBanner(true);
    };

    const installedHandler = () => {
      setShowBanner(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setShowBanner(false);
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install.');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="banner"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border border-border/60 bg-card text-card-foreground text-sm font-medium max-w-xs w-[calc(100%-2rem)] sm:w-auto"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Icon: 4-tile grid (matches app icon) */}
      <div className="shrink-0 grid grid-cols-2 gap-0.5 size-8">
        <span className="rounded-sm bg-[#4ade80]" />
        <span className="rounded-sm bg-[#facc15]" />
        <span className="rounded-sm bg-[#60a5fa]" />
        <span className="rounded-sm bg-[#c084fc]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold leading-snug">Tasally</p>
        <p className="text-xs text-muted-foreground truncate">Install for quick access</p>
      </div>

      <button
        onClick={handleInstall}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold bg-[hsl(142,43%,54%)] text-white hover:bg-[hsl(142,43%,46%)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Install
      </button>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss install banner"
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
