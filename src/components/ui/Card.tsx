'use client';

import React, { forwardRef } from 'react';

/**
 * Card - Design System Card Component
 * 
 * Variants: default | elevated | outlined | ghost
 */

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[hsl(var(--card))] border border-[hsl(var(--card-border))]
    shadow-sm
  `,
  elevated: `
    bg-[hsl(var(--card))] border border-[hsl(var(--card-border))]
    shadow-lg
  `,
  outlined: `
    bg-transparent border-2 border-[hsl(var(--border))]
  `,
  ghost: `
    bg-transparent
  `,
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        rounded-2xl transition-all duration-200
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverable ? 'hover:shadow-lg hover:border-[hsl(var(--border-active))] hover:-translate-y-0.5' : ''}
        ${clickable ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

// Card Title
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({
  className = '',
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={`text-xl font-bold text-[hsl(var(--foreground))] ${className}`}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

// Card Description
interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(({
  className = '',
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={`text-sm text-[hsl(var(--muted-foreground))] ${className}`}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription';

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`${className}`}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({
  className = '',
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-4 ${className}`}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export default Card;
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps, CardVariant, CardPadding };
