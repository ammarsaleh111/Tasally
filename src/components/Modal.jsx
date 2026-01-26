'use client';

import React, { useEffect, useCallback, useRef } from 'react';

/**
 * Modal - Unified modal component for all games
 * 
 * Features:
 * - Smooth animations with reduced-motion support
 * - Focus trap for accessibility
 * - Escape key to close
 * - Click outside to close
 * - Multiple sizes
 * - Optional close button
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} actions - Modal action buttons
 * @param {function} onClose - Close handler (optional)
 * @param {'sm' | 'md' | 'lg' | 'xl'} size - Modal size
 * @param {boolean} showCloseButton - Show X button in corner
 * @param {boolean} closeOnEscape - Close on Escape key
 * @param {boolean} closeOnBackdrop - Close on backdrop click
 */

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const Modal = ({ 
  isOpen, 
  title, 
  children, 
  actions, 
  onClose,
  size = 'sm',
  wide = false, // Legacy prop - maps to 'lg'
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle escape key
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Focus trap and restore focus
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;
      
      // Focus the modal
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusable) focusable.focus();
        }
      }, 100);

      // Add escape listener
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        
        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  // Use wide prop for backwards compatibility
  const actualSize = wide ? 'lg' : size;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[hsl(var(--background))]/60 backdrop-blur-sm transition-opacity duration-300" 
        aria-hidden="true"
      />

      {/* Content */}
      <div 
        ref={modalRef}
        className={`
          relative w-full ${sizeStyles[actualSize]}
          bg-[hsl(var(--card))] 
          border border-[hsl(var(--card-border))] 
          rounded-2xl shadow-2xl
          p-6
          max-h-[90vh] overflow-y-auto
          transform transition-all duration-300 ease-out
          motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:fade-in
          motion-reduce:animate-none
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="
              absolute top-4 right-4 
              p-2 rounded-full
              text-[hsl(var(--muted-foreground))] 
              hover:text-[hsl(var(--foreground))]
              hover:bg-[hsl(var(--surface-hover))]
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]
            "
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Title */}
        {title && (
          <h2 
            id="modal-title"
            className="text-xl font-bold text-center mb-4 text-[hsl(var(--foreground))] pr-8"
          >
            {title}
          </h2>
        )}
        
        {/* Content */}
        <div className="text-[hsl(var(--foreground))]">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex flex-col gap-3 mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
