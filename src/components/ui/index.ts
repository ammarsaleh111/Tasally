/**
 * Tasally - Design System UI Components
 * 
 * A unified component library for consistent UI across the platform.
 * All components are theme-aware and support both light and dark modes.
 */

// Button Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { IconButton } from './IconButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from './IconButton';

// Card Components
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

// Badge Component
export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// Tabs Component
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export type { TabsProps, TabsVariant } from './Tabs';

// Input Components
export { Input, Select, Checkbox, Toggle } from './Input';
export type { InputProps, SelectProps, CheckboxProps, ToggleProps } from './Input';

// Progress Components
export { ProgressBar, StatRow, StatCard } from './Progress';
export type { ProgressBarProps, StatRowProps, StatCardProps } from './Progress';

// Skeleton/Loading Components
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
} from './Skeleton';
export type {
  SkeletonProps,
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonAvatarProps,
  SkeletonButtonProps,
  LoadingSpinnerProps,
  LoadingOverlayProps,
} from './Skeleton';

// Tooltip Component
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';
