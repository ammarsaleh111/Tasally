// src/components/SiteHeader.jsx
'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';

export default function SiteHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="w-full flex items-center justify-between p-4 border-b border-border-default bg-background/80 backdrop-blur sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Menu Icon Placeholder */}
        <button className="text-text-muted hover:text-foreground p-2 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>

        <Link href="/" className="text-2xl font-serif font-bold tracking-tight hover:opacity-80 transition-opacity text-foreground">
            Ammar Times
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link 
            href="/games" 
            className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors"
        >
            All Games
        </Link>
        
        <Link 
            href="/themes" 
            className="text-sm font-semibold text-text-muted hover:text-foreground transition-colors"
        >
            🎭 Themes
        </Link>
        
        {/* Theme Toggle */}
        <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors text-foreground"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {theme === 'dark' ? (
                /* Sun Icon */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            ) : (
                /* Moon Icon */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            )}
        </button>
      </div>
    </nav>
  );
}
