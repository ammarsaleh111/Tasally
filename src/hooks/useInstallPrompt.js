'use client';

/**
 * useInstallPrompt — single source of truth for PWA install state.
 */

import { useCallback, useEffect, useState } from 'react';

const bus = typeof window !== 'undefined' ? new EventTarget() : null;
let _deferredPrompt = null;
let _installed = false;
let _ios = false;
let _initialised = false;

function _notify() {
  bus?.dispatchEvent(new Event('change'));
}

// Run browser detection exactly once
if (typeof window !== 'undefined' && !_initialised) {
  _initialised = true;

  const ua = navigator.userAgent.toLowerCase();
  _ios = /iphone|ipad|ipod/.test(ua);

  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = ('standalone' in navigator) && navigator.standalone === true;
  _installed = standalone || iosStandalone;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    _installed = false;
    _notify();
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    _installed = true;
    _notify();
  });
}

// ── React hook ─────────────────────────────────────────────────────
export function useInstallPrompt() {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!bus) return;
    const handler = () => setTick((n) => n + 1);
    bus.addEventListener('change', handler);
    // If beforeinstallprompt already fired before this component mounted,
    // force a re-render so canInstall reflects the current state.
    if (_deferredPrompt !== null) {
      queueMicrotask(() => setTick((n) => n + 1));
    }
    return () => bus.removeEventListener('change', handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!_deferredPrompt) return 'dismissed';
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;
    if (outcome === 'accepted') {
      _installed = true;
    }
    _notify();
    return outcome;
  }, []);

  const clearPrompt = useCallback(() => {
    _deferredPrompt = null;
    _notify();
  }, []);

  return {
    isInstalled: _installed,
    isIOS: _ios,
    canInstall: _deferredPrompt !== null,
    triggerInstall,
    clearPrompt,
  };
}

/**
 * Non-reactive read of install state.
 * Use this in components that only need a one-time snapshot (e.g. OnboardingFlow)
 * and don't need to re-render when the install prompt arrives.
 */
export function getInstallState() {
  return {
    isInstalled: _installed,
    isIOS: _ios,
    canInstall: _deferredPrompt !== null,
  };
}

/**
 * Trigger the native install prompt (non-hook version).
 */
export async function triggerInstallPrompt() {
  if (!_deferredPrompt) return 'dismissed';
  _deferredPrompt.prompt();
  const { outcome } = await _deferredPrompt.userChoice;
  _deferredPrompt = null;
  if (outcome === 'accepted') {
    _installed = true;
  }
  _notify();
  return outcome;
}

