'use client';

import React, { useState, useEffect } from 'react';
import { getProfile } from '@/utils/profileManager';

/**
 * FeedbackForm Component
 * 
 * Premium animated feedback form that:
 * - Integrates with Formspree for submissions
 * - Auto-fills player data (name, userId, page, date)
 * - Shows elegant loading/success/error states
 * - Respects dark/light mode
 * - Smooth animations (ease-out, 200-300ms)
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Callback when form is closed
 * @param {boolean} isFloating - If true, renders as floating panel from icon
 */
export default function FeedbackForm({ isOpen = true, onClose = () => {}, isFloating = false }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error
  const [profile, setProfile] = useState(() => {
    // Initialize profile from localStorage if available
    if (typeof window !== 'undefined') {
      return getProfile();
    }
    return null;
  });

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }

    setStatus('sending');

    const formData = new FormData();
    formData.append('name', profile?.name || 'Anonymous');
    formData.append('userId', profile?.id || 'anonymous');
    formData.append('message', message);
    formData.append('page', typeof window !== 'undefined' ? window.location.pathname : '');
    formData.append('date', new Date().toISOString());

    try {
      const response = await fetch('https://formspree.io/f/xgooezdl', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const shouldRender = isFloating ? isOpen : true;

  if (!shouldRender) return null;

  // For embedded mode (Profile page), render without backdrop and with adjusted styling
  if (!isFloating) {
    return (
      <div className="bg-surface-default border-2 border-border-default rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-wordle-correct to-connections-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Your Feedback Matters</h3>
              <p className="text-sm text-white/80 mt-1">
                Help us make Ammar Times better
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name (Read-only, prefilled) */}
          {profile?.name && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={profile.name}
                readOnly
                dir="auto"
                className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border-default text-text-muted cursor-not-allowed name-text"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message <span className="text-wordle-present">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, report a bug, or suggest a feature..."
              required
              rows={6}
              disabled={status === 'sending' || status === 'success'}
              className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border-default text-foreground placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-wordle-correct focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-wordle-correct/10 border-2 border-wordle-correct text-wordle-correct px-4 py-3 rounded-lg flex items-center gap-3 animate-slideIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Thanks for your feedback!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-wordle-absent/10 border-2 border-wordle-absent text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 animate-slideIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Could not send. Try again.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!message.trim() || status === 'sending' || status === 'success'}
            className={`w-full px-6 py-3 rounded-lg font-bold text-white transition-all duration-200 ${
              !message.trim() || status === 'sending' || status === 'success'
                ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-wordle-correct to-connections-purple hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {status === 'sending' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : status === 'success' ? (
              'Sent'
            ) : (
              'Send Feedback'
            )}
          </button>

          {/* Context Info */}
          <p className="text-xs text-text-muted text-center">
            Sent from: {typeof window !== 'undefined' ? window.location.pathname : ''}
          </p>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        style={{
          animation: 'fadeIn 300ms ease-out'
        }}
      />

      {/* Feedback Panel */}
      <div
        className={`fixed z-50 bg-surface-default border-2 border-border-default rounded-2xl shadow-2xl overflow-hidden ${
          isFloating 
            ? 'top-20 right-6 w-96' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg mx-4'
        }`}
        style={{
          animation: isFloating 
            ? 'slideInFromTopRight 300ms ease-out'
            : 'scaleIn 200ms ease-out'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-wordle-correct to-connections-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Send Feedback</h2>
              <p className="text-sm text-white/80 mt-1">
                We&apos;d love to hear from you
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close feedback form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name (Read-only, prefilled) */}
          {profile?.name && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={profile.name}
                readOnly
                dir="auto"
                className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border-default text-text-muted cursor-not-allowed name-text"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message <span className="text-wordle-present">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, report a bug, or suggest a feature..."
              required
              rows={6}
              disabled={status === 'sending' || status === 'success'}
              className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border-default text-foreground placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-wordle-correct focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="bg-wordle-correct/10 border-2 border-wordle-correct text-wordle-correct px-4 py-3 rounded-lg flex items-center gap-3 animate-slideIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Thanks for your feedback!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-wordle-absent/10 border-2 border-wordle-absent text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 animate-slideIn">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Could not send. Try again.</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!message.trim() || status === 'sending' || status === 'success'}
            className={`w-full px-6 py-3 rounded-lg font-bold text-white transition-all duration-200 ${
              !message.trim() || status === 'sending' || status === 'success'
                ? 'bg-surface-hover text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-wordle-correct to-connections-purple hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {status === 'sending' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : status === 'success' ? (
              'Sent'
            ) : (
              'Send Feedback'
            )}
          </button>

          {/* Context Info */}
          <p className="text-xs text-text-muted text-center">
            Sent from: {typeof window !== 'undefined' ? window.location.pathname : ''}
          </p>
        </form>
      </div>

      <style jsx>{`
        .animate-slideIn {
          animation: slideIn 240ms ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes slideInFromTopRight {
          from {
            opacity: 0;
            transform: translateY(-20px) translateX(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
