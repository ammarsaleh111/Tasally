'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Hook to lock body scroll when tutorial is active.
 * Prevents any page scrolling while the tutorial overlay is shown.
 */
const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;
    if (typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const originalStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      height: document.body.style.height,
    };

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Prevent scroll events
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventKeys = (e) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(e.key)) {
        // Allow arrow keys for tutorial navigation, but prevent scroll
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKeys, { passive: false });

    return () => {
      // Restore original styles
      document.body.style.overflow = originalStyle.overflow;
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.left = originalStyle.left;
      document.body.style.width = originalStyle.width;
      document.body.style.height = originalStyle.height;

      // Restore scroll position
      window.scrollTo(scrollX, scrollY);

      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventKeys);
    };
  }, [isLocked]);
};

/**
 * Check if element is visible in the viewport (not hidden, has dimensions)
 */
const isElementVisible = (element) => {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/**
 * Check if element is within viewport bounds
 */
const isElementInViewport = (rect) => {
  if (!rect) return false;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  return (
    rect.top >= -rect.height &&
    rect.left >= -rect.width &&
    rect.bottom <= viewportHeight + rect.height &&
    rect.right <= viewportWidth + rect.width
  );
};

const useHighlightRect = (selector, isOpen) => {
  const [rect, setRect] = useState(null);
  const [elementMissing, setElementMissing] = useState(false);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || !selector) {
      setRect(null);
      setElementMissing(false);
      warnedRef.current = false;
      return;
    }

    const findAndUpdateElement = () => {
      const element = document.querySelector(selector);
      
      if (!element || !isElementVisible(element)) {
        // Log warning once for debugging but don't crash
        if (process.env.NODE_ENV === 'development' && !warnedRef.current) {
          console.warn(`[Tutorial] Element not found or hidden: ${selector}`);
          warnedRef.current = true;
        }
        setRect(null);
        setElementMissing(true);
        return null;
      }

      warnedRef.current = false;
      setElementMissing(false);
      return element;
    };

    const updateRect = () => {
      const element = findAndUpdateElement();
      if (!element) return;

      const bounds = element.getBoundingClientRect();
      
      // Check if element is reasonably within viewport
      if (!isElementInViewport(bounds)) {
        setRect(null);
        return;
      }

      setRect({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        bottom: bounds.bottom,
        right: bounds.right,
      });
    };

    // Initial update
    updateRect();

    // Handle resize and orientation changes - recalculate position
    const handleResize = () => {
      requestAnimationFrame(updateRect);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Use ResizeObserver if available
    let resizeObserver;
    const element = document.querySelector(selector);
    if (element && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateRect);
      resizeObserver.observe(element);
    }

    // Mutation observer to detect if element appears/disappears
    let mutationObserver;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(updateRect);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden'],
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, [selector, isOpen]);

  return { rect, elementMissing };
};

const getTooltipPosition = (highlightRect, tooltipRect, viewportWidth, viewportHeight) => {
  const margin = 16;
  const gap = 12;
  const minSpace = 100; // Minimum space needed for tooltip

  // Calculate available space in each direction
  const spaceBottom = viewportHeight - (highlightRect.top + highlightRect.height + gap);
  const spaceTop = highlightRect.top - gap;
  const spaceRight = viewportWidth - (highlightRect.left + highlightRect.width + gap);
  const spaceLeft = highlightRect.left - gap;

  // Check if there's enough space for tooltip in any direction
  const fitsBottom = spaceBottom >= tooltipRect.height + margin;
  const fitsTop = spaceTop >= tooltipRect.height + margin;
  const fitsRight = spaceRight >= tooltipRect.width + margin;
  const fitsLeft = spaceLeft >= tooltipRect.width + margin;

  // If no direction has enough space, fallback to center
  if (!fitsBottom && !fitsTop && !fitsRight && !fitsLeft) {
    return {
      left: (viewportWidth - tooltipRect.width) / 2,
      top: (viewportHeight - tooltipRect.height) / 2,
      placement: 'center',
    };
  }

  // Priority: bottom > top > right > left (as per requirements)
  let placement = 'bottom';
  if (fitsBottom) {
    placement = 'bottom';
  } else if (fitsTop) {
    placement = 'top';
  } else if (fitsRight) {
    placement = 'right';
  } else if (fitsLeft) {
    placement = 'left';
  }

  const centerX = highlightRect.left + highlightRect.width / 2;
  const centerY = highlightRect.top + highlightRect.height / 2;

  let left, top;

  switch (placement) {
    case 'bottom':
      left = centerX - tooltipRect.width / 2;
      top = highlightRect.top + highlightRect.height + gap;
      break;
    case 'top':
      left = centerX - tooltipRect.width / 2;
      top = highlightRect.top - gap - tooltipRect.height;
      break;
    case 'right':
      left = highlightRect.left + highlightRect.width + gap;
      top = centerY - tooltipRect.height / 2;
      break;
    case 'left':
      left = highlightRect.left - gap - tooltipRect.width;
      top = centerY - tooltipRect.height / 2;
      break;
    default:
      left = centerX - tooltipRect.width / 2;
      top = highlightRect.top + highlightRect.height + gap;
  }

  // Clamp to ensure popup stays within viewport bounds (NEVER causes scroll)
  const maxLeft = Math.max(viewportWidth - tooltipRect.width - margin, margin);
  const maxTop = Math.max(viewportHeight - tooltipRect.height - margin, margin);
  
  left = clamp(left, margin, maxLeft);
  top = clamp(top, margin, maxTop);

  return { left, top, placement };
};

const getHighlightStyle = (highlightRect, viewportWidth, viewportHeight) => {
  const padding = 10;
  const margin = 8;

  const left = highlightRect.left - padding;
  const top = highlightRect.top - padding;
  const right = highlightRect.left + highlightRect.width + padding;
  const bottom = highlightRect.top + highlightRect.height + padding;

  const clampedLeft = clamp(left, margin, viewportWidth - margin);
  const clampedTop = clamp(top, margin, viewportHeight - margin);
  const clampedRight = clamp(right, margin, viewportWidth - margin);
  const clampedBottom = clamp(bottom, margin, viewportHeight - margin);

  return {
    left: clampedLeft,
    top: clampedTop,
    width: Math.max(clampedRight - clampedLeft, 0),
    height: Math.max(clampedBottom - clampedTop, 0),
  };
};

const TutorialPanel = ({
  isOpen,
  tutorial,
  startAt = 0,
  resumeStep = 0,
  onStepChange,
  onClose,
  onSkip,
  onComplete,
}) => {
  const steps = tutorial?.steps || [];
  const totalSteps = steps.length;
  const normalizedStart = clamp(startAt, 0, Math.max(totalSteps - 1, 0));
  const [currentStep, setCurrentStep] = useState(normalizedStart);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [placement, setPlacement] = useState('center');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const panelRef = useRef(null);
  const tooltipRef = useRef(null);

  // Lock body scroll when tutorial is open - CRITICAL for no-scroll requirement
  useScrollLock(isOpen);

  // Track viewport size for responsive positioning
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(normalizedStart);
  }, [isOpen, normalizedStart]);

  useEffect(() => {
    if (!isOpen) return;
    if (panelRef.current) {
      panelRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !onStepChange) return;
    onStepChange(currentStep);
  }, [currentStep, isOpen, onStepChange]);

  const step = steps[currentStep] || {};
  const highlightSelector = step.highlight?.selector;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Use the improved highlight rect hook that returns { rect, elementMissing }
  const { rect: highlightRect, elementMissing } = useHighlightRect(highlightSelector, isOpen);
  
  // Determine if step should be centered:
  // - First/last steps
  // - Steps marked as centered
  // - No highlight selector
  // - Element is missing or not visible (graceful fallback)
  const isCenteredStep = Boolean(
    step.centered || 
    isFirstStep || 
    isLastStep || 
    !highlightSelector ||
    elementMissing ||
    !highlightRect
  );
  
  const showHighlight = !isCenteredStep && highlightRect;

  // REMOVED: scrollIntoView - the popup moves, NOT the page
  // The tutorial popup repositions itself around the highlighted element
  // instead of scrolling the page to the element

  useLayoutEffect(() => {
    if (!isOpen) return;
    if (isCenteredStep || !highlightRect || !tooltipRef.current) {
      setPlacement('center');
      setTooltipStyle({});
      return;
    }

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const next = getTooltipPosition(highlightRect, tooltipRect, viewportWidth, viewportHeight);

    setPlacement(next.placement);
    setTooltipStyle({ left: next.left, top: next.top });
  }, [isOpen, isCenteredStep, highlightRect, currentStep]);

  const handleNext = () => {
    if (currentStep >= totalSteps - 1) {
      if (onComplete) onComplete();
      return;
    }
    setCurrentStep((prev) => clamp(prev + 1, 0, totalSteps - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => clamp(prev - 1, 0, totalSteps - 1));
  };

  const handlePanelKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose?.();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleBack();
    }

    event.stopPropagation();
  };

  const showResume = resumeStep > 0 && normalizedStart === 0 && currentStep === 0;

  if (!isOpen || totalSteps === 0) return null;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const highlightStyle = showHighlight
    ? getHighlightStyle(highlightRect, viewportWidth, viewportHeight)
    : null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{
        // Prevent any scroll/touch interaction that could cause page movement
        overscrollBehavior: 'none',
        touchAction: 'none',
      }}
    >
      <div
        className="absolute inset-0 bg-[hsl(var(--background))]/55 backdrop-blur-[2px]"
        aria-hidden="true"
        // Clicking backdrop closes tutorial
        onClick={onClose}
      />

      {showHighlight && highlightStyle && (
        <div
          className="pointer-events-none absolute"
          style={{
            top: highlightStyle.top,
            left: highlightStyle.left,
            width: highlightStyle.width,
            height: highlightStyle.height,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl border-2 border-[hsl(var(--accent))] motion-reduce:animate-none"
            style={{
              boxShadow: '0 0 0 4px hsl(var(--accent) / 0.18), 0 0 24px hsl(var(--accent) / 0.3)',
            }}
          />
        </div>
      )}

      <aside
        ref={(el) => {
          panelRef.current = el;
          tooltipRef.current = el;
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-body"
        onKeyDown={handlePanelKeyDown}
        className={`
          absolute
          bg-[hsl(var(--card))]
          border border-[hsl(var(--border))]
          rounded-3xl
          p-6 md:p-7
          shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]
          focus:outline-none
          motion-safe:animate-fade-in-up motion-reduce:animate-none
          will-change-transform
          ${isCenteredStep ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center' : 'text-left'}
        `}
        style={{
          width: 'calc(100vw - 32px)',
          maxWidth: viewportWidth >= 768 ? '480px' : '90vw',
          // Ensure popup never causes overflow
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          ...(isCenteredStep ? {} : tooltipStyle),
        }}
      >
        <div className={`flex items-start ${isCenteredStep ? 'justify-between' : 'justify-between'} gap-4`}>
          <div className={`text-xs uppercase tracking-wider font-medium text-text-muted ${isCenteredStep ? 'text-center' : ''}`}>
            {tutorial?.title || 'Tutorial'}
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mt-1 -mr-1 rounded-full hover:bg-[hsl(var(--surface-hover))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center justify-center"
            aria-label="Close tutorial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`mt-5 flex ${isCenteredStep ? 'flex-col items-center text-center' : 'items-start gap-4'}`}>
          {step.illustration && (
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--accent))]/12 text-[hsl(var(--accent))] flex items-center justify-center text-2xl flex-shrink-0">
              {step.illustration}
            </div>
          )}
          <div className={isCenteredStep ? 'mt-4' : 'flex-1'}>
            <div className="text-xs font-medium text-text-muted mb-1">Step {currentStep + 1} of {totalSteps}</div>
            <h3 id="tutorial-title" className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {step.title}
            </h3>
          </div>
        </div>

        <p id="tutorial-body" className={`mt-4 text-base md:text-[15px] text-[hsl(var(--foreground))]/80 leading-relaxed ${isCenteredStep ? 'text-center' : ''}`}>
          {step.body}
        </p>

        {step.gesture && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--accent))]/8 border border-[hsl(var(--accent))]/20 px-4 py-2 text-sm text-foreground">
            <span className="text-text-muted">Gesture:</span>
            <span className="font-semibold text-[hsl(var(--accent))]">{step.gesture}</span>
          </div>
        )}

        {showResume && (
          <button
            onClick={() => setCurrentStep(clamp(resumeStep, 0, totalSteps - 1))}
            className="mt-5 min-h-[44px] px-4 text-sm font-medium text-[hsl(var(--accent))] hover:text-[hsl(var(--accent))]/80 underline underline-offset-4 transition-colors"
          >
            Resume from step {clamp(resumeStep + 1, 1, totalSteps)}
          </button>
        )}

        <div className="mt-7 border-t border-[hsl(var(--border))] pt-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1 min-h-[48px] rounded-xl border-2 border-[hsl(var(--border))] text-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[hsl(var(--surface-hover))] hover:border-[hsl(var(--foreground))]/20 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 min-h-[48px] rounded-xl bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))] font-semibold hover:bg-[hsl(var(--button-primary-hover))] shadow-sm hover:shadow-md transition-all"
            >
              {currentStep >= totalSteps - 1 ? 'Start Playing' : 'Next'}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={onSkip}
              className="min-h-[44px] text-sm font-medium text-text-muted hover:text-foreground transition-colors"
            >
              Skip tutorial
            </button>
            {step.footer && (
              <div className="text-xs text-text-muted/70 text-center leading-relaxed">
                {step.footer}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
};

export default TutorialPanel;
