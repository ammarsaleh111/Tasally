'use client';

import React from 'react';

/**
 * Skeleton - Design System Skeleton Loader Component
 * For placeholder content while loading
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-[hsl(var(--muted))]/50
        ${variantStyles[variant]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={style}
    />
  );
};

/**
 * SkeletonText - For text placeholder
 */

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Card-shaped skeleton
 */

interface SkeletonCardProps {
  hasImage?: boolean;
  hasTitle?: boolean;
  lines?: number;
  className?: string;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  hasTitle = true,
  lines = 2,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-[hsl(var(--card))] border border-[hsl(var(--card-border))]
        rounded-2xl p-4 space-y-4
        ${className}
      `}
    >
      {hasImage && (
        <Skeleton variant="rectangular" height={120} className="w-full" />
      )}
      {hasTitle && (
        <Skeleton variant="text" height={24} className="w-3/4" />
      )}
      <SkeletonText lines={lines} />
    </div>
  );
};

/**
 * SkeletonAvatar - Avatar-shaped skeleton
 */

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <Skeleton
      variant="circular"
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
};

/**
 * SkeletonButton - Button-shaped skeleton
 */

interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const buttonHeightMap = {
  sm: 32,
  md: 40,
  lg: 48,
};

const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  return (
    <Skeleton
      variant="rectangular"
      height={buttonHeightMap[size]}
      className={`rounded-xl ${fullWidth ? 'w-full' : 'w-24'} ${className}`}
    />
  );
};

/**
 * GameCardSkeleton - Skeleton for game cards in the hub
 */

const GameCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`
        bg-[hsl(var(--card))] border border-[hsl(var(--card-border))]
        rounded-2xl p-6 space-y-4
        ${className}
      `}
    >
      {/* Icon */}
      <div className="flex justify-center">
        <Skeleton variant="rectangular" width={64} height={64} className="rounded-xl" />
      </div>
      
      {/* Title */}
      <div className="text-center space-y-2">
        <Skeleton variant="text" height={28} className="w-2/3 mx-auto" />
        <Skeleton variant="text" height={16} className="w-full" />
      </div>
      
      {/* Button */}
      <div className="flex justify-center">
        <Skeleton variant="text" height={20} className="w-1/2" />
      </div>
    </div>
  );
};

/**
 * LeaderboardRowSkeleton - Skeleton for leaderboard rows
 */

const LeaderboardRowSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
      <Skeleton variant="text" width={24} height={24} />
      <Skeleton variant="circular" width={36} height={36} />
      <Skeleton variant="text" height={20} className="flex-1" />
      <Skeleton variant="text" width={60} height={20} />
      <Skeleton variant="text" width={40} height={16} />
    </div>
  );
};

/**
 * LoadingSpinner - Simple loading spinner
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <svg
      className={`animate-spin ${spinnerSizeMap[size]} text-[hsl(var(--accent))] ${className}`}
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
};

/**
 * LoadingOverlay - Full-screen loading overlay
 */

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(var(--background))]/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  GameCardSkeleton,
  LeaderboardRowSkeleton,
  LoadingSpinner,
  LoadingOverlay,
};

export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonAvatarProps,
  SkeletonButtonProps,
  LoadingSpinnerProps,
  LoadingOverlayProps,
};
