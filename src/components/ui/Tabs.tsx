'use client';

import React, { createContext, useContext, useState, forwardRef } from 'react';

/**
 * Tabs - Design System Tabs/SegmentedControl Component
 */

type TabsVariant = 'default' | 'pills' | 'underline' | 'segmented';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

// Tabs Root
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  variant?: TabsVariant;
  children: React.ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(({
  value,
  onValueChange,
  variant = 'default',
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange, variant }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

// Tabs List
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const variantListStyles: Record<TabsVariant, string> = {
  default: 'bg-[hsl(var(--secondary))]/50 p-1 rounded-xl gap-1',
  pills: 'gap-2',
  underline: 'border-b border-[hsl(var(--border))] gap-0',
  segmented: 'bg-[hsl(var(--secondary))]/50 p-1 rounded-xl gap-0',
};

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({
  className = '',
  children,
  ...props
}, ref) => {
  const { variant } = useTabsContext();
  
  return (
    <div
      ref={ref}
      role="tablist"
      className={`
        flex flex-wrap items-center
        ${variantListStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

TabsList.displayName = 'TabsList';

// Tab Trigger
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const variantTriggerStyles: Record<TabsVariant, { base: string; active: string; inactive: string }> = {
  default: {
    base: 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
    active: 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm',
    inactive: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))]/50',
  },
  pills: {
    base: 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
    active: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm',
    inactive: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]',
  },
  underline: {
    base: 'px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
    active: 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]',
    inactive: 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]',
  },
  segmented: {
    base: 'flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 first:rounded-l-lg last:rounded-r-lg',
    active: 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm',
    inactive: 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]',
  },
};

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(({
  value,
  className = '',
  children,
  ...props
}, ref) => {
  const { value: selectedValue, onValueChange, variant } = useTabsContext();
  const isActive = selectedValue === value;
  const styles = variantTriggerStyles[variant];
  
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => onValueChange(value)}
      className={`
        ${styles.base}
        ${isActive ? styles.active : styles.inactive}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

// Tab Content
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(({
  value,
  className = '',
  children,
  ...props
}, ref) => {
  const { value: selectedValue } = useTabsContext();
  
  if (selectedValue !== value) {
    return null;
  }
  
  return (
    <div
      ref={ref}
      role="tabpanel"
      data-state="active"
      className={`animate-fade-in-up mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsProps, TabsVariant };
