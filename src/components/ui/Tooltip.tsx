'use client';

import React from 'react';

/**
 * Tooltip - Design System Tooltip Component
 * Simple CSS-only tooltip for accessibility
 */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowStyles = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[hsl(var(--popover))]',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[hsl(var(--popover))]',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[hsl(var(--popover))]',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[hsl(var(--popover))]',
};

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  return (
    <div className={`relative inline-block group ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`
          absolute z-50 pointer-events-none
          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
          transition-all duration-200 ease-out
          ${positionStyles[position]}
        `}
      >
        <div
          className={`
            px-3 py-2 text-xs font-medium whitespace-nowrap
            bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))]
            rounded-lg shadow-lg border border-[hsl(var(--border))]
          `}
        >
          {content}
        </div>
        {/* Arrow */}
        <div
          className={`
            absolute w-0 h-0 border-4
            ${arrowStyles[position]}
          `}
        />
      </div>
    </div>
  );
};

export default Tooltip;
export { Tooltip };
export type { TooltipProps };
