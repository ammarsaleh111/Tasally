'use client';

import { useEffect, useState } from 'react';
import { getThemeBanner, getActiveTheme } from '@/utils/themeEngine';

export default function ThemeBanner() {
  const [banner] = useState(() => getThemeBanner());
  const [theme] = useState(() => getActiveTheme());
  const [visible, setVisible] = useState(() => {
    const activeTheme = getActiveTheme();
    if (activeTheme) {
      const dismissed = typeof window !== 'undefined' ? localStorage.getItem(`banner-dismissed-${activeTheme.id}`) : null;
      return dismissed !== 'true';
    }
    return true;
  });

  const handleDismiss = () => {
    setVisible(false);
    if (theme) {
      localStorage.setItem(`banner-dismissed-${theme.id}`, 'true');
    }
  };

  if (!banner || !visible) return null;

  return (
    <div
      className="relative w-full py-3 px-4 text-center font-bold text-lg animate-slide-down"
      style={{
        backgroundColor: banner.backgroundColor,
        color: banner.textColor
      }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex-1 text-center">
          {banner.text}
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
