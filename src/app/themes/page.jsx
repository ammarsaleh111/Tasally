'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActiveTheme, getUpcomingThemes, THEMES } from '@/utils/themeEngine';

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState(null);
  const [upcomingThemes, setUpcomingThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safely load theme data on the client side
    try {
      const active = getActiveTheme();
      const upcoming = getUpcomingThemes() || [];
      setActiveTheme(active);
      setUpcomingThemes(upcoming);
    } catch (error) {
      console.error('Error loading themes:', error);
      setUpcomingThemes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-info border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8 animate-fade-in-up">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            🎭 Themed Events
          </h1>
          <p className="text-xl text-muted-foreground">
            Special events and seasonal challenges
          </p>
        </div>

        {/* Active Theme */}
        {activeTheme && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              🎯 Active Now
            </h2>
            <div
              className="bg-card border-4 rounded-2xl p-8 animate-pulse-subtle"
              style={{ borderColor: activeTheme.colors?.primary || '#3b82f6' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-6xl">{activeTheme.emoji || '🎭'}</span>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-foreground">
                    {activeTheme.name || 'Theme'}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTheme.startDate || 'N/A'} to {activeTheme.endDate || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <p className="text-lg font-semibold text-foreground">
                  Themed Games Available:
                </p>
                {activeTheme.games && Object.entries(activeTheme.games).map(([gameId, gameConfig]) => (
                  <div
                    key={gameId}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg p-4 border border-border"
                  >
                    <div>
                      <div className="font-semibold text-foreground capitalize">
                        {gameId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {gameConfig?.description || 'Themed gameplay'}
                      </div>
                    </div>
                    <Link
                      href={`/games/${gameId}`}
                      className="px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: activeTheme.colors?.primary || '#3b82f6',
                        color: 'white'
                      }}
                    >
                      Play →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Themes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            📅 Coming Soon
          </h2>
          {upcomingThemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingThemes.slice(0, 6).map((theme) => (
                <div
                  key={theme.id}
                  className="bg-card border-2 border-border rounded-xl p-6 hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{theme.emoji || '🎭'}</span>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {theme.name || 'Upcoming Theme'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Starts {theme.startDate || 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {theme.games ? Object.keys(theme.games).length : 0} games themed
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No upcoming themes at the moment</p>
            </div>
          )}
        </div>

        {/* All Themes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            🎨 All Themes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(THEMES || {}).map((theme) => {
              const isActive = activeTheme?.id === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`
                    bg-card border-2 rounded-xl p-4 text-center transition-all
                    ${isActive ? 'border-success scale-105' : 'border-border hover:border-info'}
                  `}
                >
                  <div className="text-4xl mb-2">{theme.emoji || '🎭'}</div>
                  <div className="font-semibold text-foreground text-sm">
                    {theme.name || 'Theme'}
                  </div>
                  {isActive && (
                    <div className="mt-2 text-xs text-success font-bold">
                      ACTIVE NOW
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link 
            href="/games"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
}
