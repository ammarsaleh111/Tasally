'use client';

import React, { useState } from 'react';
import FeedbackForm from './FeedbackForm';

/**
 * FloatingFeedbackButton Component
 * 
 * A premium floating feedback button that:
 * - Appears in the top-right corner of game pages
 * - Semi-transparent with subtle glow effect
 * - Smooth hover animations (scale, glow increase)
 * - Expands into feedback form with elegant animation
 * - Never blocks gameplay
 * - Respects theme colors
 */
export default function FloatingFeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-wordle-correct to-connections-purple text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group"
          style={{
            opacity: 0.85,
            animation: 'floatIn 300ms ease-out'
          }}
          aria-label="Send feedback"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wordle-correct to-connections-purple opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-200" />
          
          {/* Icon */}
          <svg 
            className="w-6 h-6 relative z-10 transition-transform duration-200 group-hover:scale-110" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>

          {/* Subtle pulse animation on idle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-wordle-correct to-connections-purple animate-ping opacity-20" />
        </button>
      )}

      {/* Feedback Form */}
      <FeedbackForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        isFloating={true}
      />

      <style jsx>{`
        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
          }
          to {
            opacity: 0.85;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
