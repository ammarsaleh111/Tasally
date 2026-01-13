'use client';

import React, { useState, useEffect } from 'react';
import { getAvatarById, DEFAULT_AVATAR_ID } from '@/utils/avatarLibrary';
import { getBrowserInfo, prefersReducedMotion } from '@/utils/crossBrowser';

/**
 * Avatar3D - Cross-browser compatible 3D-style animated avatar display component
 * 
 * Features:
 * - Gradient backgrounds with depth effect
 * - Idle animations (float, pulse, sparkle, bounce, sway, blink)
 * - Multiple sizes (xs, sm, md, lg, xl)
 * - Click handler for avatar picker
 * - 3D depth with shadows and highlights
 * - Cross-browser compatible (Firefox, Safari, Chrome)
 * - Respects prefers-reduced-motion
 * - Graceful degradation for older browsers
 */

const SIZES = {
  xs: { container: 32, emoji: 16 },
  sm: { container: 48, emoji: 24 },
  md: { container: 64, emoji: 32 },
  lg: { container: 96, emoji: 48 },
  xl: { container: 128, emoji: 64 },
  '2xl': { container: 160, emoji: 80 },
};

// CSS animation keyframes - Cross-browser compatible
const animations = {
  float: `
    @-webkit-keyframes avatar-float {
      0%, 100% { -webkit-transform: translateY(0px) rotate(0deg); transform: translateY(0px) rotate(0deg); }
      50% { -webkit-transform: translateY(-4px) rotate(2deg); transform: translateY(-4px) rotate(2deg); }
    }
    @keyframes avatar-float {
      0%, 100% { -webkit-transform: translateY(0px) rotate(0deg); transform: translateY(0px) rotate(0deg); }
      50% { -webkit-transform: translateY(-4px) rotate(2deg); transform: translateY(-4px) rotate(2deg); }
    }
  `,
  pulse: `
    @-webkit-keyframes avatar-pulse {
      0%, 100% { -webkit-transform: scale(1); transform: scale(1); }
      50% { -webkit-transform: scale(1.05); transform: scale(1.05); }
    }
    @keyframes avatar-pulse {
      0%, 100% { -webkit-transform: scale(1); transform: scale(1); }
      50% { -webkit-transform: scale(1.05); transform: scale(1.05); }
    }
  `,
  sparkle: `
    @-webkit-keyframes avatar-sparkle {
      0%, 100% { opacity: 1; -webkit-filter: brightness(1); filter: brightness(1); }
      50% { opacity: 0.95; -webkit-filter: brightness(1.2); filter: brightness(1.2); }
    }
    @keyframes avatar-sparkle {
      0%, 100% { opacity: 1; -webkit-filter: brightness(1); filter: brightness(1); }
      50% { opacity: 0.95; -webkit-filter: brightness(1.2); filter: brightness(1.2); }
    }
  `,
  bounce: `
    @-webkit-keyframes avatar-bounce {
      0%, 100% { -webkit-transform: translateY(0); transform: translateY(0); }
      25% { -webkit-transform: translateY(-3px); transform: translateY(-3px); }
      75% { -webkit-transform: translateY(1px); transform: translateY(1px); }
    }
    @keyframes avatar-bounce {
      0%, 100% { -webkit-transform: translateY(0); transform: translateY(0); }
      25% { -webkit-transform: translateY(-3px); transform: translateY(-3px); }
      75% { -webkit-transform: translateY(1px); transform: translateY(1px); }
    }
  `,
  sway: `
    @-webkit-keyframes avatar-sway {
      0%, 100% { -webkit-transform: rotate(-3deg); transform: rotate(-3deg); }
      50% { -webkit-transform: rotate(3deg); transform: rotate(3deg); }
    }
    @keyframes avatar-sway {
      0%, 100% { -webkit-transform: rotate(-3deg); transform: rotate(-3deg); }
      50% { -webkit-transform: rotate(3deg); transform: rotate(3deg); }
    }
  `,
  blink: `
    @-webkit-keyframes avatar-blink {
      0%, 45%, 55%, 100% { -webkit-transform: scaleY(1); transform: scaleY(1); }
      50% { -webkit-transform: scaleY(0.9); transform: scaleY(0.9); }
    }
    @keyframes avatar-blink {
      0%, 45%, 55%, 100% { -webkit-transform: scaleY(1); transform: scaleY(1); }
      50% { -webkit-transform: scaleY(0.9); transform: scaleY(0.9); }
    }
  `,
};

const Avatar3D = ({ 
  avatarId, 
  size = 'md', 
  onClick, 
  showEditBadge = false,
  className = '',
  animate = true,
}) => {
  // Initialize with proper reduced motion check
  const [shouldAnimate, setShouldAnimate] = useState(() => {
    if (typeof window === 'undefined') return animate;
    return animate && !prefersReducedMotion();
  });
  
  const avatar = getAvatarById(avatarId || DEFAULT_AVATAR_ID);
  const sizeConfig = SIZES[size] || SIZES.md;
  
  // Listen for changes to reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;
    
    const handleChange = (e) => {
      setShouldAnimate(animate && !e.matches);
    };
    
    // Use the new API if available, otherwise fall back
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Safari < 14 fallback
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [animate]);
  
  const animationStyle = shouldAnimate && avatar.animation ? {
    animation: `avatar-${avatar.animation} 3s ease-in-out infinite`,
    // Ensure animation works across browsers
    WebkitAnimation: `avatar-${avatar.animation} 3s ease-in-out infinite`,
  } : {};

  return (
    <>
      {/* Inject animation keyframes */}
      <style jsx global>{`
        ${Object.values(animations).join('\n')}
      `}</style>
      
      <div 
        className={`relative inline-flex ${className}`}
        style={{ width: sizeConfig.container, height: sizeConfig.container }}
      >
        {/* Outer glow effect */}
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-md"
          style={{ background: avatar.gradient }}
        />
        
        {/* Main avatar container */}
        <button
          onClick={onClick}
          disabled={!onClick}
          className={`
            relative w-full h-full rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wordle-correct
          `}
          style={{
            background: avatar.gradient,
            boxShadow: `
              inset 0 2px 4px rgba(255, 255, 255, 0.3),
              inset 0 -2px 4px rgba(0, 0, 0, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.15)
            `,
            ...animationStyle,
          }}
          title={onClick ? 'Change avatar' : avatar.name}
        >
          {/* Inner highlight for 3D effect */}
          <div 
            className="absolute inset-[2px] rounded-full opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
            }}
          />
          
          {/* Emoji/Avatar display */}
          <span 
            className="relative z-10 select-none"
            style={{ fontSize: sizeConfig.emoji }}
            role="img"
            aria-label={avatar.name}
          >
            {avatar.emoji}
          </span>
        </button>
        
        {/* Edit badge */}
        {showEditBadge && onClick && (
          <div className="absolute -bottom-1 -right-1 bg-wordle-correct text-white rounded-full p-1 shadow-lg">
            <svg 
              width={sizeConfig.container / 4} 
              height={sizeConfig.container / 4} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
};

export default Avatar3D;
