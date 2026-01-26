'use client';

import React, { forwardRef } from 'react';

/**
 * Badge - Design System Badge Component
 * 
 * Variants: default | success | warning | danger | info | accent | outline
 */

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]
  `,
  success: `
    bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]
    border border-[hsl(var(--success))]/30
  `,
  warning: `
    bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]
    border border-[hsl(var(--warning))]/30
  `,
  danger: `
    bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]
    border border-[hsl(var(--destructive))]/30
  `,
  info: `
    bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]
    border border-[hsl(var(--info))]/30
  `,
  accent: `
    bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]
    border border-[hsl(var(--accent))]/30
  `,
  outline: `
    bg-transparent text-[hsl(var(--muted-foreground))]
    border border-[hsl(var(--border))]
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center justify-center font-medium rounded-full
        transition-colors duration-200
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
