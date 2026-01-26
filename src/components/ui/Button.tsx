'use client';

import React, { forwardRef } from 'react';

/**
 * Button - Design System Primary Button Component
 * 
 * Variants: primary | secondary | ghost | outline | destructive | success
 * Sizes: sm | md | lg
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]
    hover:bg-[hsl(var(--accent))]/90
    active:bg-[hsl(var(--accent))]/80
    shadow-sm hover:shadow-md
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]/50
  `,
  secondary: `
    bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
    hover:bg-[hsl(var(--secondary))]/80
    active:bg-[hsl(var(--secondary))]/70
    border border-[hsl(var(--border))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
  ghost: `
    bg-transparent text-[hsl(var(--foreground))]
    hover:bg-[hsl(var(--surface-hover))]
    active:bg-[hsl(var(--muted))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
  outline: `
    bg-transparent text-[hsl(var(--foreground))]
    border-2 border-[hsl(var(--border))]
    hover:border-[hsl(var(--border-active))] hover:bg-[hsl(var(--surface-hover))]
    active:bg-[hsl(var(--muted))]
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50
  `,
  destructive: `
    bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]
    hover:bg-[hsl(var(--destructive))]/90
    active:bg-[hsl(var(--destructive))]/80
    shadow-sm hover:shadow-md
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--destructive))]/50
  `,
  success: `
    bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]
    hover:bg-[hsl(var(--success))]/90
    active:bg-[hsl(var(--success))]/80
    shadow-sm hover:shadow-md
    focus-visible:ring-2 focus-visible:ring-[hsl(var(--success))]/50
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={size} />
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// Loading Spinner
function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  
  return (
    <svg
      className={`${spinnerSize} animate-spin absolute`}
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
