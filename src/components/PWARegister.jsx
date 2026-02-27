'use client';

/**
 * PWARegister
 * Registers the service worker once the page is loaded.
 * Renders nothing — purely a side-effect component.
 * Safe to add to the root layout.
 */
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Never register the SW in development — CacheFirst for _next/static
    // chunks would serve stale bundles during HMR / Turbopack rebuilds.
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed, ready in background — will activate on next visit.
              console.log('[PWA] New version available. Will activate on next visit.');
            }
          });
        });
      } catch (err) {
        // SW registration failure should never break the page
        console.warn('[PWA] Service worker registration failed:', err);
      }
    };

    // Defer registration until after the page is interactive
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
