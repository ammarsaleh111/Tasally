// src/components/SiteHeader.jsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProviderNew';
import AuthButton from './AuthButton';
import InstallAppHeaderButton from './InstallAppHeaderButton';
import { logout, useAppSession } from '@/utils/sessionManager';

export default function SiteHeader() {
  const { appearance, toggleAppearance } = useTheme();
  const session = useAppSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Determine if user is admin (only render Reset Session for admins)
  const isAdmin = session?.role === 'ADMIN';

  // Track scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/games', label: 'Games', icon: '🎮' },
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/themes', label: 'Themes', icon: '🎭' },
    { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  ];

  return (
    <>
      <nav 
        className={`
          w-full sticky top-0 z-50
          transition-all duration-300 ease-out
          ${isScrolled 
            ? 'bg-[hsl(var(--background))]/95 backdrop-blur-md shadow-sm border-b border-[hsl(var(--border))]' 
            : 'bg-[hsl(var(--background))]/80 backdrop-blur-sm border-b border-transparent'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="
                text-xl sm:text-2xl font-serif font-bold tracking-tight 
                text-[hsl(var(--foreground))]
                hover:text-[hsl(var(--accent))]
                transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded-lg
              "
            >
              Ammar Times
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="
                    px-3 py-2 rounded-lg
                    text-sm font-medium
                    text-[hsl(var(--muted-foreground))]
                    hover:text-[hsl(var(--foreground))]
                    hover:bg-[hsl(var(--surface-hover))]
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
                    flex items-center gap-2
                  "
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
         

              {/* Auth Button - Desktop */}
              <div className="hidden sm:block">
                <AuthButton />
              </div>

              {/* Reset Session - ADMIN ONLY */}
              {isAdmin && (
                <button
                  onClick={() => logout()}
                  className="
                    hidden sm:inline-flex
                    px-2.5 py-1.5 rounded-md
                    text-xs font-semibold
                    bg-[hsl(var(--surface-hover))]
                    text-[hsl(var(--foreground))]
                    hover:bg-[hsl(var(--muted))]
                    transition-colors duration-200
                  "
                  title="Reset session (admin only)"
                >
                  Reset Session
                </button>
              )}

              {/* Theme Toggle */}
              <button 
                onClick={toggleAppearance}
                className="
                  p-2.5 rounded-full
                  text-[hsl(var(--muted-foreground))]
                  hover:text-[hsl(var(--foreground))]
                  hover:bg-[hsl(var(--surface-hover))]
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
                "
                title={appearance === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={appearance === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {appearance === 'dark' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="
                  md:hidden p-2.5 rounded-lg
                  text-[hsl(var(--muted-foreground))]
                  hover:text-[hsl(var(--foreground))]
                  hover:bg-[hsl(var(--surface-hover))]
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
                "
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-out
            ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="px-4 py-3 space-y-1 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  text-base font-medium
                  text-[hsl(var(--foreground))]
                  hover:bg-[hsl(var(--surface-hover))]
                  active:bg-[hsl(var(--muted))]
                  transition-colors duration-200
                "
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            
            {/* Auth Button - Mobile */}
            <div className="pt-2 border-t border-[hsl(var(--border))]">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
