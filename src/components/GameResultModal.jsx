'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WinConfettiOverlay, { CONFETTI_PROFILES } from './WinConfettiOverlay';

/**
 * GameResultModal - Unified Win/Lose Experience
 * 
 * Design Philosophy:
 * ✅ WIN = Celebration, Achievement, Reward
 * ❌ LOSE = Encouragement, Learning, Softness
 * 
 * @param {boolean} isOpen
 * @param {boolean} isWin - true for WIN, false for LOSE
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Result content
 * @param {React.ReactNode} actions - Action buttons
 * @param {function} onClose - Close handler
 * @param {object} stats - Game statistics for display
 * @param {string} gameName - Game identifier for confetti profile + styling
 * @param {boolean} isPerfect - Whether this was a perfect score (triggers mega burst)
 */
const GameResultModal = ({ 
  isOpen, 
  isWin, 
  title, 
  children, 
  actions, 
  onClose,
  stats = {},
  gameName = 'game',
  isPerfect = false,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [iconAnimated, setIconAnimated] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);

  const handleConfettiDone = useCallback(() => {
    setShowConfetti(false);
  }, []);

  useEffect(() => {
    if (isOpen && isWin) {
      // Delay confetti slightly for better effect
      const confettiTimer = setTimeout(() => setShowConfetti(true), 200);
      // Icon pop animation
      const iconTimer = setTimeout(() => setIconAnimated(true), 100);
      // Shimmer sweep
      const shimmerTimer = setTimeout(() => setShimmerActive(true), 400);
      
      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(iconTimer);
        clearTimeout(shimmerTimer);
        setShowConfetti(false);
        setIconAnimated(false);
        setShimmerActive(false);
      };
    } else {
      queueMicrotask(() => {
        setShowConfetti(false);
        setIconAnimated(false);
        setShimmerActive(false);
      });
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Resolve confetti profile for this game
  const profile = CONFETTI_PROFILES[gameName] || {};

  // WIN STATE STYLING
  const winStyles = {
    backdrop: 'bg-gradient-to-b from-success/20 via-background/60 to-background/80',
    container: 'bg-gradient-to-br from-success/10 via-card to-card border-2 border-success/50 shadow-2xl shadow-success/20',
    icon: '🎉',
    iconBg: 'bg-gradient-to-br from-success/30 to-success/10',
    titleColor: 'text-success',
    animation: 'animate-in zoom-in-95 slide-in-from-bottom-4 duration-500',
    pulse: isWin && isOpen ? 'animate-pulse-subtle' : '',
  };

  // LOSE STATE STYLING
  const loseStyles = {
    backdrop: 'bg-background/40',
    container: 'bg-card border border-border/50 shadow-lg',
    icon: '💭',
    iconBg: 'bg-muted/20',
    titleColor: 'text-muted-foreground',
    animation: 'animate-in fade-in slide-in-from-bottom-2 duration-700',
    pulse: '',
  };

  const styles = isWin ? winStyles : loseStyles;

  return (
    <>
      {/* Confetti for WIN — unified canvas engine */}
      {showConfetti && (
        <WinConfettiOverlay
          active={showConfetti}
          gameName={gameName}
          isPerfect={isPerfect}
          origin={profile.origin || 'corners'}
          intensity={profile.intensity || 1}
          durationMs={profile.durationMs || 3000}
          palette={profile.palette}
          shapes={profile.shapes}
          onDone={handleConfettiDone}
        />
      )}

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${styles.backdrop} ${styles.animation}`}
        onClick={handleBackdropClick}
      >
        {/* Modal Container */}
        <div className={`relative w-full max-w-md ${styles.container} rounded-2xl p-8 ${styles.pulse} max-h-[90vh] overflow-y-auto transform transition-all ${isWin && shimmerActive ? 'modal-shimmer' : ''}`}>
          
          {/* Sparkle pseudo-elements for win */}
          {isWin && <div className="modal-sparkles" aria-hidden="true" />}

          {/* Icon Badge */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full ${styles.iconBg} flex items-center justify-center text-5xl ${isWin ? 'animate-bounce-gentle' : ''} ${iconAnimated ? 'modal-icon-pop' : 'scale-0'} transition-transform`}>
              {styles.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className={`text-3xl font-bold text-center mb-2 ${styles.titleColor} transition-colors`}>
            {title}
          </h2>

          {/* Subtitle Message */}
          {isWin ? (
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Excellent work! 🌟
            </p>
          ) : (
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Keep practicing — you&apos;ll get it! 💪
            </p>
          )}

          {/* Divider */}
          <div className={`h-px w-full mb-6 ${isWin ? 'bg-gradient-to-r from-transparent via-success/30 to-transparent' : 'bg-border/50'}`} />

          {/* Content */}
          <div className="text-foreground space-y-4 mb-6">
            {children}
          </div>

          {/* Stats Summary (if provided) */}
          {stats && Object.keys(stats).length > 0 && (
            <div className={`grid grid-cols-3 gap-3 mb-6 p-4 rounded-xl ${isWin ? 'bg-success/5 border border-success/20' : 'bg-muted/10 border border-border/30'}`}>
              {stats.attempts !== undefined && (
                <StatBadge label="Attempts" value={stats.attempts} isWin={isWin} />
              )}
              {stats.time !== undefined && (
                <StatBadge label="Time" value={stats.time} isWin={isWin} />
              )}
              {stats.accuracy !== undefined && (
                <StatBadge label="Accuracy" value={`${stats.accuracy}%`} isWin={isWin} />
              )}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="space-y-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Stat Badge Component
const StatBadge = ({ label, value, isWin }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold ${isWin ? 'text-success' : 'text-foreground'}`}>
      {value}
    </div>
    <div className="text-xs text-muted-foreground mt-1">
      {label}
    </div>
  </div>
);

export default GameResultModal;
