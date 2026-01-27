'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getGameTheme } from '@/utils/themeEngine';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });
  const [seasonalTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const activeTheme = getGameTheme();
      return activeTheme && activeTheme.id ? activeTheme.id : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (seasonalTheme) {
      document.documentElement.setAttribute('data-theme', seasonalTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.style.visibility = 'visible';
  }, [theme, seasonalTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, seasonalTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
