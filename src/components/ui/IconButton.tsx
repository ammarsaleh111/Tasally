'use client';

import React, { forwardRef } from 'react';

/**
 * IconButton - Circular icon-only button with accessibility
 */

type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  'aria-label': string; // Required for accessibility
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary: `
    bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
    hover:bg-[hsl(var(--accent))]/90
    active:bg-[hsl(var(--accent))]/80
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50
  `,
  secondary: `
    bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
    hover:bg-[hsl(var(--secondary))]/80
    border border-[hsl(var(--border))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
  ghost: `
    bg-transparent text-[hsl(var(--muted-foreground))]
    hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--foreground))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
  outline: `
    bg-transparent text-[hsl(var(--foreground))]
    border-2 border-[hsl(var(--border))]
    hover:border-[hsl(var(--border-active))] hover:bg-[hsl(var(--surface-hover))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <svg
          className="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
export { IconButton };
export type { IconButtonProps, IconButtonVariant, IconButtonSize };
