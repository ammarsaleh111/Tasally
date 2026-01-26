'use client';

import React, { forwardRef, useId } from 'react';

/**
 * Input - Design System Input Component
 */

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  hint?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-4',
  lg: 'h-12 text-base px-4',
};

const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  error = false,
  errorMessage,
  leftIcon,
  rightIcon,
  label,
  hint,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full rounded-lg
            bg-[hsl(var(--background))]
            border transition-all duration-200
            text-[hsl(var(--foreground))]
            placeholder:text-[hsl(var(--muted-foreground))]
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[hsl(var(--muted))]
            ${error 
              ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]/30 focus:border-[hsl(var(--destructive))]'
              : 'border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]/30 focus:border-[hsl(var(--ring))]'
            }
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${sizeStyles[size]}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(errorMessage || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
          {errorMessage || hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Select - Design System Select Component
 */

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  size = 'md',
  error = false,
  errorMessage,
  label,
  hint,
  options,
  placeholder,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5"
        >
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        className={`
          w-full rounded-lg appearance-none cursor-pointer
          bg-[hsl(var(--background))]
          border transition-all duration-200
          text-[hsl(var(--foreground))]
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[hsl(var(--muted))]
          pr-10
          ${error 
            ? 'border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))]/30'
            : 'border-[hsl(var(--border))] focus:ring-[hsl(var(--ring))]/30'
          }
          ${sizeStyles[size]}
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {(errorMessage || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
          {errorMessage || hint}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

/**
 * Checkbox - Design System Checkbox Component
 */

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  description,
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const checkboxId = id || `checkbox-${generatedId}`;
  
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        disabled={disabled}
        className={`
          mt-0.5 h-4 w-4 rounded
          border-[hsl(var(--border))] 
          text-[hsl(var(--accent))]
          focus:ring-2 focus:ring-[hsl(var(--ring))]/30 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
        {...props}
      />
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`text-sm font-medium text-[hsl(var(--foreground))] ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

/**
 * Toggle - Design System Toggle/Switch Component
 */

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({
  label,
  description,
  className = '',
  disabled,
  checked,
  id,
  ...props
}, ref) => {
  const generatedId = useId();
  const toggleId = id || `toggle-${generatedId}`;
  
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={toggleId}
              className={`text-sm font-medium text-[hsl(var(--foreground))] ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {description}
            </span>
          )}
        </div>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
          if (input) input.click();
        }}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
          border-2 border-transparent transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/50 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--muted))]'}
        `}
      >
        <span
          className={`
            pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      
      <input
        ref={ref}
        id={toggleId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
    </div>
  );
});

Toggle.displayName = 'Toggle';

export { Input, Select, Checkbox, Toggle };
export type { InputProps, SelectProps, CheckboxProps, ToggleProps };
