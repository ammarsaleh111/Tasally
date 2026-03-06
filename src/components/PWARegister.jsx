'use client';

/**
 * PWARegister
 * Registers the service worker once the page is loaded.
 * Renders nothing — purely a side-effect component.
 * Safe to add to the root layout.
 */
import { useEffect } from 'react';

function getCanonicalSwScriptUrl(buildVersion) {
  const version = buildVersion || 'dev';
  return `/sw.js?v=${encodeURIComponent(version)}`;
}

async function unregisterLegacyWorkers(scopeOrigin) {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrl =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL;

      if (!scriptUrl) {
        return;
      }

      const parsedUrl = new URL(scriptUrl);
      if (parsedUrl.origin !== scopeOrigin) {
        return;
      }

      if (parsedUrl.pathname !== '/sw.js') {
        await registration.unregister();
      }
    })
  );
}

export default function PWARegister({ buildVersion }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Never register the SW in development — CacheFirst for _next/static
    // chunks would serve stale bundles during HMR / Turbopack rebuilds.
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        await unregisterLegacyWorkers(window.location.origin);

        const registration = await navigator.serviceWorker.register(getCanonicalSwScriptUrl(buildVersion), {
          scope: '/',
          updateViaCache: 'none',
        });

        await registration.update();

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[PWA] New offline bundle installed and waiting for the next full restart.');
            }
          });
        });

        const updateOnResume = () => {
          registration.update().catch(() => {});
        };

        document.addEventListener('visibilitychange', updateOnResume, { passive: true });
        window.addEventListener('online', updateOnResume, { passive: true });

        return () => {
          document.removeEventListener('visibilitychange', updateOnResume);
          window.removeEventListener('online', updateOnResume);
        };
      } catch (err) {
        // SW registration failure should never break the page
        console.warn('[PWA] Service worker registration failed:', err);
      }
    };

    // Defer registration until after the page is interactive
    if (document.readyState === 'complete') {
      let cleanup;
      Promise.resolve(register()).then((nextCleanup) => {
        cleanup = nextCleanup;
      });
      return () => cleanup?.();
    } else {
      let cleanup;
      const onLoad = () => {
        Promise.resolve(register()).then((nextCleanup) => {
          cleanup = nextCleanup;
        });
      };

      window.addEventListener('load', onLoad);
      return () => {
        window.removeEventListener('load', onLoad);
        cleanup?.();
      };
    }
  }, [buildVersion]);

  return null;
}
