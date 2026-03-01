'use client';

import React, { useState, useEffect } from 'react';
import { getGameTheme } from '@/utils/themeEngine';

/**
 * Premium Puzzle Loading Experience
 * 
 * Render gate that shows on:
 * - First site load
 * - Entering games hub
 * 
 * Features:
 * - Animated grid assembly
 * - Theme-aware content
 * - GPU-accelerated animations
 * 
 * This component is now used as a conditional render, not an overlay.
 * When parent unmounts this, the entire component disappears from DOM.
 */
export default function PuzzleLoader() {
  const [theme] = useState(() => getGameTheme());
  const [currentDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      style={{
        animation: 'fadeIn 400ms ease-out'
      }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="grid-animation">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="grid-line"
              style={{
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto px-6">
        {/* Logo / Glyph */}
        <div 
          className="mb-8 text-8xl animate-float"
          style={{
            animation: 'floatIn 800ms ease-out, float 3s ease-in-out infinite',
          }}
        >
          {theme?.emoji || '🎮'}
        </div>

        {/* Brand */}
        <div 
          className="mb-6 overflow-hidden"
          style={{
            animation: 'slideUp 600ms ease-out 200ms backwards'
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-wordle-correct via-connections-purple to-connections-blue bg-clip-text text-transparent">
            Tasally
          </h1>
        </div>

        {/* Theme Title */}
        {theme && (
          <div 
            className="mb-8 text-center"
            style={{
              animation: 'fadeIn 600ms ease-out 400ms backwards'
            }}
          >
            <div className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              {theme.banner?.text || theme.name}
            </div>
            <div className="text-sm text-text-muted">
              {currentDate}
            </div>
          </div>
        )}

        {!theme && (
          <div 
            className="mb-8 text-center"
            style={{
              animation: 'fadeIn 600ms ease-out 400ms backwards'
            }}
          >
            <div className="text-xl text-text-muted">
              {currentDate}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <div 
          className="w-64 h-1 bg-surface-hover rounded-full overflow-hidden"
          style={{
            animation: 'fadeIn 600ms ease-out 600ms backwards'
          }}
        >
          <div 
            className="h-full bg-gradient-to-r from-wordle-correct via-connections-purple to-connections-blue"
            style={{
              animation: 'progressPulse 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Loading Text */}
        <div 
          className="mt-6 text-sm text-text-muted"
          style={{
            animation: 'fadeIn 600ms ease-out 800ms backwards'
          }}
        >
          <span className="inline-flex items-center gap-2">
            <span>Preparing today&apos;s puzzles</span>
            <span className="loading-dots">
              <span style={{ animationDelay: '0ms' }}>.</span>
              <span style={{ animationDelay: '150ms' }}>.</span>
              <span style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressPulse {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .grid-animation {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 2rem;
          padding: 2rem;
        }

        .grid-line {
          border-left: 1px solid currentColor;
          opacity: 0;
          animation: gridLineIn 800ms ease-out forwards;
          will-change: opacity, transform;
        }

        @keyframes gridLineIn {
          from {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: top;
          }
          to {
            opacity: 0.3;
            transform: scaleY(1);
          }
        }

        .loading-dots span {
          animation: dotPulse 1.5s ease-in-out infinite;
          display: inline-block;
        }

        @keyframes dotPulse {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
