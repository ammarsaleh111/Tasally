'use client';

/**
 * SeasonIdentity - Comprehensive 5-Layer Seasonal Visual System
 * 
 * This component provides FULL visual identity for each season:
 * 
 * LAYER 1: Global Background - Full-page patterns at subtle opacity
 * LAYER 2: Page Header Identity - Season badge + tagline on every page  
 * LAYER 3: Card & Surface Texture - Seasonal textures on cards/panels
 * LAYER 4: Micro UI Reinforcement - Dividers, icons, ornaments
 * LAYER 5: Ambient Motion - Subtle animations (respects reduced-motion)
 * 
 * If a user opens any page, they IMMEDIATELY feel: "This is Winter" / "This is Spring" etc.
 */

import { useSyncExternalStore, createContext, useContext, ReactNode } from 'react';
import { useTheme } from './ThemeProviderNew';

// ============================================================================
// SEASON CONFIGURATION - Visual Identity Packs
// ============================================================================

export interface SeasonVisualPack {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  emojiSet: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  pattern: string;
  cornerDecor: string;
  microIcons: string[];
  headerGradient: string;
  cardBorder: string;
  dividerStyle: string;
  ambientAnimation: string;
}

export const SEASON_PACKS: Record<string, SeasonVisualPack> = {
  spring: {
    id: 'spring',
    name: 'Spring',
    tagline: 'Fresh beginnings bloom!',
    emoji: '🌸',
    emojiSet: ['🌸', '🌷', '🌱', '🦋', '🐝', '🌺', '🌼', '💐'],
    colors: {
      primary: '#FF69B4',
      secondary: '#90EE90',
      accent: '#FFB6C1',
      glow: 'rgba(255, 105, 180, 0.15)',
    },
    pattern: '/themes/patterns/spring-full.svg',
    cornerDecor: '/themes/corners/spring-corner.svg',
    microIcons: ['🌸', '🦋', '🌷'],
    headerGradient: 'linear-gradient(135deg, rgba(255,105,180,0.1) 0%, rgba(144,238,144,0.1) 100%)',
    cardBorder: '1px solid rgba(255, 105, 180, 0.2)',
    dividerStyle: 'spring-divider',
    ambientAnimation: 'spring-float',
  },
  
  summer: {
    id: 'summer',
    name: 'Summer',
    tagline: 'Sizzling puzzles ahead!',
    emoji: '☀️',
    emojiSet: ['☀️', '🌊', '🏖️', '🍦', '🌴', '🐚', '🦀', '🍉'],
    colors: {
      primary: '#FFD700',
      secondary: '#00CED1',
      accent: '#FFA500',
      glow: 'rgba(255, 215, 0, 0.15)',
    },
    pattern: '/themes/patterns/summer-full.svg',
    cornerDecor: '/themes/corners/summer-corner.svg',
    microIcons: ['☀️', '🌊', '🏖️'],
    headerGradient: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,206,209,0.1) 100%)',
    cardBorder: '1px solid rgba(255, 215, 0, 0.2)',
    dividerStyle: 'summer-divider',
    ambientAnimation: 'summer-shimmer',
  },
  
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    tagline: 'Cozy puzzles await!',
    emoji: '🍂',
    emojiSet: ['🍂', '🍁', '🎃', '🌰', '🦊', '🍎', '🥧', '☕'],
    colors: {
      primary: '#D2691E',
      secondary: '#DAA520',
      accent: '#CD853F',
      glow: 'rgba(210, 105, 30, 0.15)',
    },
    pattern: '/themes/patterns/autumn-full.svg',
    cornerDecor: '/themes/corners/autumn-corner.svg',
    microIcons: ['🍂', '🍁', '🎃'],
    headerGradient: 'linear-gradient(135deg, rgba(210,105,30,0.1) 0%, rgba(218,165,32,0.1) 100%)',
    cardBorder: '1px solid rgba(210, 105, 30, 0.2)',
    dividerStyle: 'autumn-divider',
    ambientAnimation: 'autumn-drift',
  },
  
  winter: {
    id: 'winter',
    name: 'Winter',
    tagline: 'Warm up with puzzles!',
    emoji: '❄️',
    emojiSet: ['❄️', '⛄', '🎿', '☕', '🧣', '🎄', '🌨️', '🏔️'],
    colors: {
      primary: '#87CEEB',
      secondary: '#E0FFFF',
      accent: '#ADD8E6',
      glow: 'rgba(135, 206, 235, 0.15)',
    },
    pattern: '/themes/patterns/winter-full.svg',
    cornerDecor: '/themes/corners/winter-corner.svg',
    microIcons: ['❄️', '⛄', '☕'],
    headerGradient: 'linear-gradient(135deg, rgba(135,206,235,0.1) 0%, rgba(224,255,255,0.1) 100%)',
    cardBorder: '1px solid rgba(135, 206, 235, 0.2)',
    dividerStyle: 'winter-divider',
    ambientAnimation: 'winter-sparkle',
  },
};

// Dominant themes override seasons
export const DOMINANT_PACKS: Record<string, SeasonVisualPack> = {
  ramadan: {
    id: 'ramadan',
    name: 'Ramadan',
    tagline: 'Ramadan Kareem! 🌙',
    emoji: '🌙',
    emojiSet: ['🌙', '✨', '🕌', '⭐', '🏮', '📿', '🌟', '🕋'],
    colors: {
      primary: '#FFD700',
      secondary: '#1a365d',
      accent: '#C9A227',
      glow: 'rgba(255, 215, 0, 0.2)',
    },
    pattern: '/themes/patterns/ramadan-full.svg',
    cornerDecor: '/themes/corners/ramadan-corner.svg',
    microIcons: ['🌙', '✨', '🕌'],
    headerGradient: 'linear-gradient(135deg, rgba(26,54,93,0.3) 0%, rgba(201,162,39,0.2) 100%)',
    cardBorder: '1px solid rgba(255, 215, 0, 0.3)',
    dividerStyle: 'ramadan-divider',
    ambientAnimation: 'ramadan-glow',
  },
  
  eid: {
    id: 'eid',
    name: 'Eid',
    tagline: 'Eid Mubarak! 🎉',
    emoji: '🎉',
    emojiSet: ['🎉', '🌙', '✨', '🎊', '🎁', '🎈', '💫', '🪔'],
    colors: {
      primary: '#9B59B6',
      secondary: '#E74C3C',
      accent: '#F1C40F',
      glow: 'rgba(155, 89, 182, 0.2)',
    },
    pattern: '/themes/patterns/eid-full.svg',
    cornerDecor: '/themes/corners/eid-corner.svg',
    microIcons: ['🎉', '🎊', '🎁'],
    headerGradient: 'linear-gradient(135deg, rgba(155,89,182,0.2) 0%, rgba(231,76,60,0.15) 100%)',
    cardBorder: '1px solid rgba(155, 89, 182, 0.3)',
    dividerStyle: 'eid-divider',
    ambientAnimation: 'eid-sparkle',
  },
};

// ============================================================================
// CONTEXT FOR SEASON VISUAL PACK
// ============================================================================

interface SeasonIdentityContextValue {
  pack: SeasonVisualPack | null;
  isDominant: boolean;
  seasonId: string | null;
}

const SeasonIdentityContext = createContext<SeasonIdentityContextValue>({
  pack: null,
  isDominant: false,
  seasonId: null,
});

export function useSeasonIdentity() {
  return useContext(SeasonIdentityContext);
}

// ============================================================================
// UTILITY: Reduced Motion Detection
// ============================================================================

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

// ============================================================================
// LAYER 1: GLOBAL BACKGROUND
// ============================================================================

export function SeasonBackground() {
  const { pack, isDominant } = useSeasonIdentity();
  const reducedMotion = useReducedMotion();
  
  if (!pack) return null;
  
  return (
    <div
      className="season-global-background"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: `url("${pack.pattern}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        opacity: isDominant ? 0.06 : 0.045,
        animation: reducedMotion ? 'none' : undefined,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// LAYER 2: PAGE HEADER IDENTITY
// ============================================================================

interface SeasonPageHeaderProps {
  title: string;
  subtitle?: string;
  showBadge?: boolean;
  className?: string;
}

export function SeasonPageHeader({ 
  title, 
  subtitle, 
  showBadge = true,
  className = '' 
}: SeasonPageHeaderProps) {
  const { pack, isDominant } = useSeasonIdentity();
  
  return (
    <header className={`season-page-header ${className}`}>
      {/* Season Badge */}
      {showBadge && pack && (
        <div 
          className="season-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            marginBottom: '0.75rem',
            borderRadius: '9999px',
            background: pack.headerGradient,
            border: pack.cardBorder,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <span className="season-badge-emoji" role="img" aria-label={pack.name}>
            {pack.emoji}
          </span>
          <span style={{ color: pack.colors.primary }}>
            {pack.name}
          </span>
          <span style={{ opacity: 0.7 }}>
            {pack.tagline}
          </span>
        </div>
      )}
      
      {/* Title with optional season icon */}
      <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
        {pack && <span className="text-3xl sm:text-4xl">{pack.microIcons[0]}</span>}
        {title}
        {pack && <span className="text-3xl sm:text-4xl">{pack.microIcons[1]}</span>}
      </h1>
      
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      
      {/* Decorative line under header */}
      {pack && <SeasonDivider className="mt-6" />}
    </header>
  );
}

// ============================================================================
// LAYER 3: CARD & SURFACE TEXTURE
// ============================================================================

interface SeasonCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function SeasonCard({ 
  children, 
  className = '', 
  hover = true,
  glow = false 
}: SeasonCardProps) {
  const { pack } = useSeasonIdentity();
  
  const baseStyles = pack ? {
    border: pack.cardBorder,
    boxShadow: glow ? `0 0 20px ${pack.colors.glow}` : undefined,
  } : {};
  
  return (
    <div 
      className={`
        season-card relative overflow-hidden rounded-2xl bg-card
        ${hover ? 'transition-all duration-200 hover:scale-[1.02]' : ''}
        ${className}
      `}
      style={baseStyles}
    >
      {/* Subtle corner decorations on cards */}
      {pack && (
        <>
          <div 
            className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-40"
            style={{
              backgroundImage: `url("${pack.cornerDecor}")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden="true"
          />
          <div 
            className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-40"
            style={{
              backgroundImage: `url("${pack.cornerDecor}")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              transform: 'scaleX(-1)',
            }}
            aria-hidden="true"
          />
        </>
      )}
      {children}
    </div>
  );
}

// Card with full texture overlay
export function SeasonTexturedCard({ 
  children, 
  className = '' 
}: { children: ReactNode; className?: string }) {
  const { pack } = useSeasonIdentity();
  
  return (
    <div 
      className={`season-textured-card relative overflow-hidden rounded-2xl bg-card ${className}`}
      style={pack ? { border: pack.cardBorder } : {}}
    >
      {/* Very subtle pattern overlay */}
      {pack && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("${pack.pattern}")`,
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat',
            opacity: 0.03,
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// LAYER 4: MICRO UI REINFORCEMENT
// ============================================================================

// Season-themed divider
interface SeasonDividerProps {
  className?: string;
  variant?: 'line' | 'icons' | 'gradient';
}

export function SeasonDivider({ className = '', variant = 'icons' }: SeasonDividerProps) {
  const { pack } = useSeasonIdentity();
  
  if (!pack) {
    return <hr className={`border-border ${className}`} />;
  }
  
  if (variant === 'line') {
    return (
      <div 
        className={`h-px w-full ${className}`}
        style={{ background: `linear-gradient(90deg, transparent, ${pack.colors.primary}40, transparent)` }}
      />
    );
  }
  
  if (variant === 'gradient') {
    return (
      <div 
        className={`h-1 w-32 mx-auto rounded-full ${className}`}
        style={{ background: pack.headerGradient }}
      />
    );
  }
  
  // icons variant (default)
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div 
        className="h-px flex-1 max-w-16"
        style={{ background: `linear-gradient(90deg, transparent, ${pack.colors.primary}30)` }}
      />
      {pack.microIcons.map((icon, i) => (
        <span key={i} className="text-sm opacity-60">{icon}</span>
      ))}
      <div 
        className="h-px flex-1 max-w-16"
        style={{ background: `linear-gradient(90deg, ${pack.colors.primary}30, transparent)` }}
      />
    </div>
  );
}

// Season ornament (floating decoration)
export function SeasonOrnament({ 
  position = 'top-right',
  size = 'md',
  className = '' 
}: { 
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { pack } = useSeasonIdentity();
  const reducedMotion = useReducedMotion();
  
  if (!pack) return null;
  
  const sizeMap = { sm: '2rem', md: '3rem', lg: '4rem' };
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };
  
  return (
    <div 
      className={`absolute ${positionClasses[position]} pointer-events-none ${className}`}
      style={{
        fontSize: sizeMap[size],
        animation: reducedMotion ? 'none' : `${pack.ambientAnimation} 4s ease-in-out infinite`,
      }}
      aria-hidden="true"
    >
      {pack.emoji}
    </div>
  );
}

// Season icon (inline emoji with styling)
export function SeasonIcon({ 
  index = 0,
  className = '' 
}: { index?: number; className?: string }) {
  const { pack } = useSeasonIdentity();
  
  if (!pack) return null;
  
  const icon = pack.emojiSet[index % pack.emojiSet.length];
  
  return (
    <span className={`inline-block ${className}`} role="img" aria-hidden="true">
      {icon}
    </span>
  );
}

// Season tooltip enhancement
export function SeasonTooltip({ 
  children,
  tip,
  className = '' 
}: { children: ReactNode; tip: string; className?: string }) {
  const { pack } = useSeasonIdentity();
  
  return (
    <span 
      className={`relative group cursor-help ${className}`}
      title={tip}
    >
      {children}
      {pack && (
        <span className="ml-1 opacity-60 text-sm">{pack.microIcons[2]}</span>
      )}
    </span>
  );
}

// ============================================================================
// LAYER 5: AMBIENT MOTION (Corner Decorations)
// ============================================================================

export function SeasonCorners() {
  const { pack, isDominant } = useSeasonIdentity();
  const reducedMotion = useReducedMotion();
  
  if (!pack) return null;
  
  const cornerStyle = {
    backgroundImage: `url("${pack.cornerDecor}")`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    opacity: isDominant ? 0.6 : 0.5,
    animation: reducedMotion ? 'none' : `${pack.ambientAnimation} 6s ease-in-out infinite`,
  };
  
  return (
    <div className="hidden md:block pointer-events-none" aria-hidden="true">
      <div 
        className="fixed top-0 left-0 w-20 h-20 lg:w-24 lg:h-24"
        style={cornerStyle}
      />
      <div 
        className="fixed top-0 right-0 w-20 h-20 lg:w-24 lg:h-24"
        style={{ ...cornerStyle, transform: 'scaleX(-1)' }}
      />
      <div 
        className="fixed bottom-0 left-0 w-20 h-20 lg:w-24 lg:h-24"
        style={{ ...cornerStyle, transform: 'scaleY(-1)' }}
      />
      <div 
        className="fixed bottom-0 right-0 w-20 h-20 lg:w-24 lg:h-24"
        style={{ ...cornerStyle, transform: 'scale(-1)' }}
      />
    </div>
  );
}

// Floating particles (optional ambient motion)
export function SeasonParticles({ count = 6 }: { count?: number }) {
  const { pack } = useSeasonIdentity();
  const reducedMotion = useReducedMotion();
  
  if (!pack || reducedMotion) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute text-xl opacity-30"
          style={{
            left: `${15 + (i * 15) % 70}%`,
            top: `${10 + (i * 20) % 80}%`,
            animation: `float-particle ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * -1.5}s`,
          }}
        >
          {pack.emojiSet[i % pack.emojiSet.length]}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PROVIDER - Combines All Layers
// ============================================================================

interface SeasonIdentityProviderProps {
  children: ReactNode;
  showBackground?: boolean;
  showCorners?: boolean;
  showParticles?: boolean;
}

export function SeasonIdentityProvider({ 
  children,
  showBackground = true,
  showCorners = true,
  showParticles = false,
}: SeasonIdentityProviderProps) {
  const { season, dominantId, effectiveTheme } = useTheme();
  
  // Determine active visual pack
  let pack: SeasonVisualPack | null = null;
  let isDominant = false;
  
  // Dominant themes override seasons
  if (dominantId && effectiveTheme?.isDominantAllowed && DOMINANT_PACKS[dominantId]) {
    pack = DOMINANT_PACKS[dominantId];
    isDominant = true;
  } else if (season && SEASON_PACKS[season]) {
    pack = SEASON_PACKS[season];
  }
  
  const contextValue: SeasonIdentityContextValue = {
    pack,
    isDominant,
    seasonId: isDominant ? dominantId : season,
  };
  
  return (
    <SeasonIdentityContext.Provider value={contextValue}>
      {showBackground && <SeasonBackground />}
      {showCorners && <SeasonCorners />}
      {showParticles && <SeasonParticles />}
      {children}
    </SeasonIdentityContext.Provider>
  );
}
