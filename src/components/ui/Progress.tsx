'use client';

import React from 'react';

/**
 * ProgressBar - Design System Progress Bar Component
 */

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-[hsl(var(--muted-foreground))]',
  success: 'bg-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning))]',
  danger: 'bg-[hsl(var(--destructive))]',
  info: 'bg-[hsl(var(--info))]',
  accent: 'bg-[hsl(var(--accent))]',
};

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'accent',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        className={`
          w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden
          ${sizeStyles[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`
            h-full rounded-full
            ${variantStyles[variant]}
            ${animated ? 'transition-all duration-500 ease-out' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * StatRow - Design System Stat Row Component
 * For displaying key-value stats in a consistent format
 */

interface StatRowProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  suffix?: string;
  highlight?: boolean;
  className?: string;
}

const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  icon,
  suffix,
  highlight = false,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center justify-between py-3 px-4 
        rounded-lg transition-colors duration-200
        bg-[hsl(var(--secondary))]/30 hover:bg-[hsl(var(--secondary))]/50
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-[hsl(var(--muted-foreground))]">{icon}</span>
        )}
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <span
        className={`
          text-base font-semibold
          ${highlight ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--foreground))]'}
        `}
      >
        {value}
        {suffix && (
          <span className="text-sm font-normal text-[hsl(var(--muted-foreground))] ml-1">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
};

/**
 * StatCard - Design System Stat Card Component
 * For displaying stats in a card format
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'accent';
  className?: string;
}

const statCardVariantStyles: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-[hsl(var(--secondary))]/30',
  success: 'bg-[hsl(var(--success))]/10',
  warning: 'bg-[hsl(var(--warning))]/10',
  info: 'bg-[hsl(var(--info))]/10',
  accent: 'bg-[hsl(var(--accent))]/10',
};

const statCardTextStyles: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'text-[hsl(var(--foreground))]',
  success: 'text-[hsl(var(--success))]',
  warning: 'text-[hsl(var(--warning))]',
  info: 'text-[hsl(var(--info))]',
  accent: 'text-[hsl(var(--accent))]',
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className = '',
}) => {
  return (
    <div
      className={`
        rounded-xl p-4 text-center transition-all duration-200
        hover:scale-[1.02] hover:shadow-sm
        border border-transparent hover:border-[hsl(var(--border))]/50
        ${statCardVariantStyles[variant]}
        ${className}
      `}
    >
      {icon && <p className="text-2xl mb-1">{icon}</p>}
      <p className={`text-2xl font-bold ${statCardTextStyles[variant]}`}>{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</p>
      
      {trend && trendValue && (
        <div
          className={`
            mt-2 text-xs font-medium inline-flex items-center gap-1
            ${trend === 'up' ? 'text-[hsl(var(--success))]' : ''}
            ${trend === 'down' ? 'text-[hsl(var(--destructive))]' : ''}
            ${trend === 'neutral' ? 'text-[hsl(var(--muted-foreground))]' : ''}
          `}
        >
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
          {trendValue}
        </div>
      )}
    </div>
  );
};

export { ProgressBar, StatRow, StatCard };
export type { ProgressBarProps, StatRowProps, StatCardProps };
