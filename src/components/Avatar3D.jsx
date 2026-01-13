'use client';

import React from 'react';
import { getAvatarById, DEFAULT_AVATAR_ID } from '@/utils/avatarLibrary';

/**
 * Avatar3D - 3D-style animated avatar display component
 * 
 * Features:
 * - Gradient backgrounds with depth effect
 * - Idle animations (float, pulse, sparkle, bounce, sway, blink)
 * - Multiple sizes (xs, sm, md, lg, xl)
 * - Click handler for avatar picker
 * - 3D depth with shadows and highlights
 */

const SIZES = {
  xs: { container: 32, emoji: 16 },
  sm: { container: 48, emoji: 24 },
  md: { container: 64, emoji: 32 },
  lg: { container: 96, emoji: 48 },
  xl: { container: 128, emoji: 64 },
  '2xl': { container: 160, emoji: 80 },
};

// CSS animation keyframes
const animations = {
  float: `
    @keyframes avatar-float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(2deg); }
    }
  `,
  pulse: `
    @keyframes avatar-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `,
  sparkle: `
    @keyframes avatar-sparkle {
      0%, 100% { opacity: 1; filter: brightness(1); }
      50% { opacity: 0.95; filter: brightness(1.2); }
    }
  `,
  bounce: `
    @keyframes avatar-bounce {
      0%, 100% { transform: translateY(0); }
      25% { transform: translateY(-3px); }
      75% { transform: translateY(1px); }
    }
  `,
  sway: `
    @keyframes avatar-sway {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
  `,
  blink: `
    @keyframes avatar-blink {
      0%, 45%, 55%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.9); }
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
  const avatar = getAvatarById(avatarId || DEFAULT_AVATAR_ID);
  const sizeConfig = SIZES[size] || SIZES.md;
  
  const animationStyle = animate && avatar.animation ? {
    animation: `avatar-${avatar.animation} 3s ease-in-out infinite`,
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
