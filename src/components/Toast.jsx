'use client';

import React, { useEffect, useState, useCallback } from 'react';

/**
 * Toast - Enhanced notification toast component
 * 
 * Features:
 * - Multiple variants: default, success, error, warning, info
 * - Smooth enter/exit animations
 * - Auto-dismiss with configurable duration
 * - Manual dismiss option
 * - Accessible announcements
 * 
 * @param {string} message - Toast message
 * @param {'default' | 'success' | 'error' | 'warning' | 'info'} type - Toast variant
 * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {function} onExited - Callback when toast exits
 * @param {boolean} showIcon - Show variant icon
 * @param {boolean} dismissible - Show dismiss button
 */

const noop = () => {};

const variantStyles = {
  default: {
    bg: 'bg-[hsl(var(--popover))]',
    border: 'border-[hsl(var(--border))]',
    text: 'text-[hsl(var(--popover-foreground))]',
    icon: null,
  },
  success: {
    bg: 'bg-[hsl(var(--success))]',
    border: 'border-[hsl(var(--success))]',
    text: 'text-[hsl(var(--success-foreground))]',
    icon: '✓',
  },
  error: {
    bg: 'bg-[hsl(var(--destructive))]',
    border: 'border-[hsl(var(--destructive))]',
    text: 'text-[hsl(var(--destructive-foreground))]',
    icon: '✕',
  },
  warning: {
    bg: 'bg-[hsl(var(--warning))]',
    border: 'border-[hsl(var(--warning))]',
    text: 'text-[hsl(var(--warning-foreground))]',
    icon: '⚠',
  },
  info: {
    bg: 'bg-[hsl(var(--info))]',
    border: 'border-[hsl(var(--info))]',
    text: 'text-[hsl(var(--info-foreground))]',
    icon: 'ℹ',
  },
};

const Toast = ({ 
  message, 
  type = 'default', 
  duration = 2500, 
  onExited = noop,
  showIcon = true,
  dismissible = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setVisible(false);
    setTimeout(() => {
      onExited();
    }, 300);
  }, [onExited]);

  useEffect(() => {
    // Animate in
    const timerIn = setTimeout(() => setVisible(true), 10);
    
    // Auto-dismiss (if duration > 0)
    let timerOut;
    if (duration > 0) {
      timerOut = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      clearTimeout(timerIn);
      if (timerOut) clearTimeout(timerOut);
    };
  }, [duration, handleDismiss]);

  const variant = variantStyles[type] || variantStyles.default;

  return (
    <div 
      role="alert"
      aria-live="polite"
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-[80]
        flex items-center gap-2
        px-4 py-3 rounded-xl
        font-medium text-sm
        shadow-lg border
        transition-all duration-300 ease-out
        motion-reduce:transition-none
        ${variant.bg} ${variant.border} ${variant.text}
        ${visible && !exiting 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95'
        }
      `}
    >
      {/* Icon */}
      {showIcon && variant.icon && (
        <span className="flex-shrink-0 text-base font-bold">
          {variant.icon}
        </span>
      )}
      
      {/* Message */}
      <span className="flex-1">{message}</span>
      
      {/* Dismiss Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="
            flex-shrink-0 ml-2 p-1 rounded-full
            opacity-70 hover:opacity-100
            transition-opacity duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
          "
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast;
