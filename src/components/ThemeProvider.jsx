'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getGameTheme } from '@/utils/themeEngine';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [seasonalTheme, setSeasonalTheme] = useState(null);

  useEffect(() => {
    // Check local storage or preference
    const saved = localStorage.getItem('theme');
    if (saved) {
        setTheme(saved);
        document.documentElement.classList.toggle('dark', saved === 'dark');
    } else {
        // Default to dark per requirements
        setTheme('dark');
        document.documentElement.classList.add('dark');
    }
    
    // Check for active seasonal theme
    try {
      const activeTheme = getGameTheme();
      if (activeTheme && activeTheme.id) {
        setSeasonalTheme(activeTheme.id);
        document.documentElement.setAttribute('data-theme', activeTheme.id);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } catch {
      // Theme engine not available
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Prevent flash of unstyled content
    document.documentElement.style.visibility = 'visible';
  }, []);

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
