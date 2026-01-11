'use client';

import React, { useState } from 'react';
import { getProfile, saveProfile } from '@/utils/profileManager';

const NamePrompt = ({ onNameSet, isOpen = true }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmedName)) {
      setError('Name can only contain letters, numbers, spaces, hyphens, and apostrophes');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile with name
      const profile = getProfile();
      profile.name = trimmedName;
      saveProfile(profile);

      // Call callback
      if (onNameSet) {
        onNameSet(trimmedName);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to Ammar Times!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          What should we call you?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              disabled={isSubmitting}
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-800 dark:text-white transition-colors"
            />
            <div className="text-sm text-gray-500 mt-2">
              {name.length}/50 characters
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Continue'}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Your name helps us personalize your experience
          </p>
        </form>
      </div>
    </div>
  );
};

export default NamePrompt;
