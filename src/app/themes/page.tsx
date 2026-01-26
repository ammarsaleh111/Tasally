'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme, useAvailableThemes } from '@/components/ThemeProviderNew';
import { getDominantThemeCountdown } from '@/themes/engine';
import type { DominantTheme, SeasonTheme, SeasonSkin } from '@/themes/types';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ThemesPage() {
  const { isHydrated } = useTheme();
  
  if (!isHydrated) {
    return <ThemesPageSkeleton />;
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 animate-fade-in-up">
      <div className="max-w-4xl w-full space-y-12">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            🎨 Theme Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Customize your Ammar Times experience. Choose your appearance mode,
            add seasonal decorations, and manage special event themes.
          </p>
        </header>
        
        {/* Appearance Section */}
        <AppearanceSection />
        
        {/* Season Skins Section */}
        <SeasonSkinsSection />
        
        {/* Special Themes Section */}
        <SpecialThemesSection />
        
        {/* Settings Section */}
        <SettingsSection />
        
        {/* Back Button */}
        <footer className="text-center pt-8 pb-4">
          <Link 
            href="/games"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Games
          </Link>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// APPEARANCE SECTION
// ============================================================================

function AppearanceSection() {
  const { appearance, setAppearance } = useTheme();
  
  return (
    <section>
      <SectionHeader
        icon="🌓"
        title="Appearance"
        subtitle="Choose your preferred color mode"
      />
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <AppearanceCard
          mode="dark"
          label="Dark Mode"
          description="Easier on the eyes"
          icon="🌙"
          isSelected={appearance === 'dark'}
          onClick={() => setAppearance('dark')}
        />
        <AppearanceCard
          mode="light"
          label="Light Mode"
          description="Bright and clean"
          icon="☀️"
          isSelected={appearance === 'light'}
          onClick={() => setAppearance('light')}
        />
      </div>
    </section>
  );
}

interface AppearanceCardProps {
  mode: 'dark' | 'light';
  label: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function AppearanceCard({ mode, label, description, icon, isSelected, onClick }: AppearanceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-6 rounded-2xl border-2 transition-all duration-200
        ${isSelected 
          ? 'border-info bg-info/10 scale-[1.02]' 
          : 'border-border bg-card hover:border-info/50 hover:bg-card/80'
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckIcon />
        </div>
      )}
      
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-foreground text-lg">{label}</div>
      <div className="text-sm text-muted-foreground mt-1">{description}</div>
      
      {/* Preview */}
      <div className={`
        mt-4 h-12 rounded-lg flex items-center justify-center text-sm font-medium
        ${mode === 'dark' 
          ? 'bg-[hsl(222,47%,11%)] text-[hsl(210,40%,98%)]' 
          : 'bg-white text-[hsl(222,47%,11%)] border border-gray-200'
        }
      `}>
        Preview
      </div>
    </button>
  );
}

// ============================================================================
// SEASON SKINS SECTION
// ============================================================================

function SeasonSkinsSection() {
  const { season, setSeason, effectiveTheme } = useTheme();
  const { seasons } = useAvailableThemes();
  const [detailsTheme, setDetailsTheme] = useState<SeasonTheme | null>(null);
  
  // If dominant theme is active, season decorations are temporarily overridden
  const isOverridden = effectiveTheme.isDominantActive && effectiveTheme.isDominantAllowed;
  
  return (
    <section>
      <SectionHeader
        icon="🌸"
        title="Season Skins"
        subtitle="Add decorative touches without changing colors"
      />
      
      {isOverridden && (
        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
          <span className="font-medium">Note:</span> Season decorations are temporarily overridden by the active special theme.
          Your selection will be restored when the special theme ends.
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {seasons.map((s) => (
          <SeasonCard
            key={s.id}
            theme={s}
            isSelected={season === s.id}
            isOverridden={isOverridden}
            onClick={() => setSeason(s.id as SeasonSkin)}
            onDetails={() => setDetailsTheme(s)}
          />
        ))}
      </div>
      
      {/* None option */}
      <button
        onClick={() => setSeason(null)}
        className={`
          mt-4 w-full p-3 rounded-xl border-2 transition-all text-sm font-medium
          ${season === null
            ? 'border-info bg-info/10 text-info'
            : 'border-border text-muted-foreground hover:border-info/50'
          }
        `}
      >
        {season === null ? '✓ ' : ''}No season skin (default)
      </button>
      
      {/* Details Modal */}
      {detailsTheme && (
        <ThemeDetailsModal
          theme={detailsTheme}
          onClose={() => setDetailsTheme(null)}
        />
      )}
    </section>
  );
}

interface SeasonCardProps {
  theme: SeasonTheme;
  isSelected: boolean;
  isOverridden: boolean;
  onClick: () => void;
  onDetails: () => void;
}

function SeasonCard({ theme, isSelected, isOverridden, onClick, onDetails }: SeasonCardProps) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`
          w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
          ${isSelected 
            ? 'border-info bg-info/10' 
            : 'border-border bg-card hover:border-info/50'
          }
          ${isOverridden ? 'opacity-60' : ''}
        `}
      >
        {isSelected && (
          <div className="absolute top-2 right-2">
            <CheckIcon />
          </div>
        )}
        
        <div className="text-3xl mb-2">{theme.icon}</div>
        <div className="font-semibold text-foreground">{theme.label}</div>
        
        {/* Decoration preview */}
        <div className="mt-2 flex gap-1">
          {theme.decorations.cornerStickers?.slice(0, 3).map((sticker, i) => (
            <span key={i} className="text-sm">{sticker}</span>
          ))}
        </div>
      </button>
      
      {/* Details button */}
      <button
        onClick={onDetails}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
        title="View details"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// SPECIAL THEMES SECTION
// ============================================================================

function SpecialThemesSection() {
  const { allowDominant, effectiveTheme } = useTheme();
  const { dominant } = useAvailableThemes();
  const [detailsTheme, setDetailsTheme] = useState<DominantTheme | null>(null);
  
  return (
    <section>
      <SectionHeader
        icon="✨"
        title="Special Themes"
        subtitle="Limited-time event themes with unique styles and content"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {dominant.map((theme) => (
          <SpecialThemeCard
            key={theme.id}
            theme={theme}
            isAllowed={allowDominant}
            isApplied={effectiveTheme.dominantId === theme.id}
            onDetails={() => setDetailsTheme(theme)}
          />
        ))}
      </div>
      
      {/* Details Modal */}
      {detailsTheme && (
        <DominantThemeDetailsModal
          theme={detailsTheme}
          onClose={() => setDetailsTheme(null)}
        />
      )}
    </section>
  );
}

interface SpecialThemeCardProps {
  theme: DominantTheme;
  isAllowed: boolean;
  isApplied: boolean;
  onDetails: () => void;
}

function SpecialThemeCard({ theme, isAllowed, isApplied, onDetails }: SpecialThemeCardProps) {
  const countdown = getDominantThemeCountdown(theme.id);
  
  const statusColors = {
    active: 'bg-success/20 text-success border-success/30',
    upcoming: 'bg-info/20 text-info border-info/30',
    ended: 'bg-muted text-muted-foreground border-border',
  };
  
  return (
    <div
      className={`
        relative p-6 rounded-2xl border-2 transition-all
        ${isApplied 
          ? 'border-success bg-success/5' 
          : 'border-border bg-card'
        }
      `}
    >
      {/* Status badge */}
      <div className={`
        absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold border
        ${statusColors[countdown.status]}
      `}>
        {countdown.status === 'active' ? 'Active Now' : 
         countdown.status === 'upcoming' ? 'Upcoming' : 'Ended'}
      </div>
      
      {/* Theme info */}
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${theme.banner.backgroundColor}20` }}
        >
          {theme.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg">{theme.label}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {theme.description}
          </p>
        </div>
      </div>
      
      {/* Date range */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatDateRange(theme.dates.start, theme.dates.end)}
          </span>
          <span className="font-medium text-foreground">
            {countdown.label}
          </span>
        </div>
        
        {/* Applied/Not applied status */}
        {countdown.status === 'active' && (
          <div className="mt-3">
            {isApplied ? (
              <div className="flex items-center gap-2 text-success text-sm font-medium">
                <CheckIcon />
                <span>Currently applied</span>
              </div>
            ) : !isAllowed ? (
              <div className="text-warning text-sm">
                Not applied (disabled in settings)
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Details button */}
      <button
        onClick={onDetails}
        className="mt-4 w-full py-2 px-4 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground text-sm font-medium transition-colors"
      >
        View Details
      </button>
    </div>
  );
}

// ============================================================================
// SETTINGS SECTION
// ============================================================================

function SettingsSection() {
  const { allowDominant, setAllowDominant, resetToDefault, userPrefs } = useTheme();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const hasCustomizations = userPrefs.appearance !== 'dark' || userPrefs.season !== null || !userPrefs.allowDominant;
  
  return (
    <section>
      <SectionHeader
        icon="⚙️"
        title="Settings"
        subtitle="Control how themes are applied"
      />
      
      <div className="mt-6 space-y-4">
        {/* Allow special themes toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
          <div>
            <div className="font-medium text-foreground">Allow special event themes</div>
            <div className="text-sm text-muted-foreground mt-1">
              When enabled, special themes (Ramadan, Eid) will override your settings during their active dates
            </div>
          </div>
          <ToggleSwitch
            checked={allowDominant}
            onChange={setAllowDominant}
          />
        </div>
        
        {/* Reset button */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
          <div>
            <div className="font-medium text-foreground">Reset to Default</div>
            <div className="text-sm text-muted-foreground mt-1">
              Restore dark mode, remove season skin, enable special themes
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!hasCustomizations}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${hasCustomizations 
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset Theme Settings?"
          message="This will restore all theme settings to their defaults: Dark mode, no season skin, and special themes enabled."
          confirmLabel="Reset"
          onConfirm={() => {
            resetToDefault();
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </section>
  );
}

// ============================================================================
// MODALS
// ============================================================================

interface ThemeDetailsModalProps {
  theme: SeasonTheme;
  onClose: () => void;
}

function ThemeDetailsModal({ theme, onClose }: ThemeDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{theme.icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{theme.label}</h2>
            <p className="text-muted-foreground">Season Skin</p>
          </div>
        </div>
        
        <p className="text-foreground mb-6">{theme.description}</p>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Decorations</div>
            <div className="flex flex-wrap gap-2">
              {theme.decorations.cornerStickers?.map((sticker, i) => (
                <span key={i} className="text-2xl">{sticker}</span>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Animation Style</div>
            <div className="capitalize text-foreground">{theme.decorations.animationStyle}</div>
          </div>
          
          {theme.decorations.microCopy && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Sample Messages</div>
              <div className="space-y-1 text-sm text-foreground">
                <div>• {theme.decorations.microCopy.greeting}</div>
                <div>• {theme.decorations.microCopy.successMessage}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          Season skins add decorative elements without changing the color palette
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface DominantThemeDetailsModalProps {
  theme: DominantTheme;
  onClose: () => void;
}

function DominantThemeDetailsModal({ theme, onClose }: DominantThemeDetailsModalProps) {
  const countdown = getDominantThemeCountdown(theme.id);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 animate-scale-in max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with theme color */}
        <div 
          className="p-4 rounded-xl mb-6 text-center"
          style={{ backgroundColor: theme.banner.backgroundColor, color: theme.banner.textColor }}
        >
          <div className="text-4xl mb-2">{theme.icon}</div>
          <h2 className="text-2xl font-bold">{theme.label}</h2>
          <p className="text-sm opacity-90 mt-1">{theme.banner.subtitle}</p>
        </div>
        
        <p className="text-foreground mb-6">{theme.description}</p>
        
        <div className="space-y-4">
          {/* Dates */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-muted-foreground">Date Range</span>
            <span className="font-medium text-foreground">
              {formatDateRange(theme.dates.start, theme.dates.end)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-foreground">{countdown.label}</span>
          </div>
          
          {/* Decorations */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Decorations</div>
            <div className="flex flex-wrap gap-2">
              {theme.decorations.cornerStickers?.map((sticker, i) => (
                <span key={i} className="text-2xl">{sticker}</span>
              ))}
            </div>
          </div>
          
          {/* What changes */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">What Changes</div>
            <ul className="space-y-1 text-sm text-foreground">
              <li>• Accent colors and visual styling</li>
              <li>• Decorative elements and icons</li>
              <li>• Banner announcements</li>
              {theme.gameContent && (
                <li>• Themed game content available</li>
              )}
            </ul>
          </div>
          
          {/* Game content */}
          {theme.gameContent && Object.keys(theme.gameContent).length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Themed Games</div>
              <div className="space-y-2">
                {Object.entries(theme.gameContent).map(([gameId, content]) => (
                  <div key={gameId} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <span className="capitalize text-foreground">{gameId}</span>
                    <span className="text-sm text-muted-foreground">{content.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onCancel}>
      <div 
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
        <span>{icon}</span>
        {title}
      </h2>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative w-12 h-7 rounded-full transition-colors
        ${checked ? 'bg-success' : 'bg-muted'}
      `}
    >
      <div
        className={`
          absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

function CheckIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-info flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  );
}

function ThemesPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-info border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading theme settings...</p>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}
