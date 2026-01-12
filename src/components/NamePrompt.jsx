'use client';

import React, { useState } from 'react';
import { getProfile, saveProfile } from '@/utils/profileManager';
import { sanitizeName } from '@/utils/inputSanitizer';

const NamePrompt = ({ onNameSet, isOpen = true }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitize and validate name
    const sanitizedName = sanitizeName(name);
    
    if (!sanitizedName) {
      setError('Please enter a valid name');
      return;
    }

    if (sanitizedName.length < 1) {
      setError('Please enter your name');
      return;
    }

    if (sanitizedName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    // Additional validation - only allow safe characters
    if (!/^[a-zA-Z0-9\s\-']+$/.test(sanitizedName)) {
      setError('Name can only contain letters, numbers, spaces, hyphens, and apostrophes');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if name is taken (with sanitized input)
      const encodedName = encodeURIComponent(sanitizedName);
      const checkRes = await fetch(`/api/players?checkName=${encodedName}`);
      
      if (!checkRes.ok) {
        setError('Failed to validate name. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const checkData = await checkRes.json();
      
      if (!checkData.available) {
        setError('This name is already taken. Please choose another one.');
        setIsSubmitting(false);
        return;
      }

      // Update profile with sanitized name
      const profile = getProfile();
      profile.name = sanitizedName;
      saveProfile(profile);

      // Call callback
      if (onNameSet) {
        onNameSet(sanitizedName);
      }
    } catch (err) {
      setError('Failed to save name. Please try again.');
      console.error('Error saving name:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(e);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    
    // Allow typing but sanitize for display
    setName(value);
    setError('');
    
    // Real-time validation feedback
    if (value.length > 50) {
      setError('Name is too long');
    } else if (value && !/^[a-zA-Z0-9\s\-']+$/.test(value)) {
      setError('Only letters, numbers, spaces, hyphens, and apostrophes allowed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        <h2 className="text-3xl font-bold mb-2 text-foreground">Welcome to Ammar Times!</h2>
        <p className="text-text-muted mb-6">
          What should we call you?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              disabled={isSubmitting}
              maxLength={50}
              autoComplete="off"
              autoFocus
              className="w-full px-4 py-3 border-2 border-border-default rounded-lg focus:outline-none focus:border-border-active bg-background text-foreground transition-colors"
            />
            <div className="text-sm text-text-muted mt-2">
              {name.length}/50 characters
            </div>
          </div>

          {error && (
            <div className="p-3 bg-card border border-border-active text-foreground rounded-lg text-sm opacity-90">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 bg-button-primary hover:bg-button-primary-hover text-button-text font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
          </button>

          <p className="text-xs text-center text-text-muted">
            Your name helps us personalize your experience
          </p>
        </form>
      </div>
    </div>
  );
};

export default NamePrompt;
