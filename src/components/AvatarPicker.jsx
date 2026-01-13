'use client';

import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import Avatar3D from './Avatar3D';
import { AVATARS, AVATAR_CATEGORIES, getAllCategories, getAvatarsByCategory } from '@/utils/avatarLibrary';

/**
 * AvatarPicker - Modal for selecting a 3D avatar
 * 
 * Features:
 * - Grid of all avatars with hover rotation effect
 * - Category filters
 * - Smooth selection animation
 * - Instant preview of selection
 */

const AvatarPicker = ({ isOpen, onClose, currentAvatarId, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredAvatar, setHoveredAvatar] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(currentAvatarId);
  
  const categories = getAllCategories();
  const filteredAvatars = selectedCategory === 'all' 
    ? AVATARS 
    : getAvatarsByCategory(selectedCategory);

  const handleSelect = useCallback((avatarId) => {
    setPreviewAvatar(avatarId);
    onSelect(avatarId);
    // Small delay for visual feedback before closing
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onSelect, onClose]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Choose Your Avatar"
    >
      <div className="space-y-6">
        {/* Preview Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-card-border">
          <Avatar3D 
            avatarId={previewAvatar} 
            size="2xl" 
            animate={true}
          />
          <p className="mt-3 text-lg font-semibold text-foreground">
            {AVATARS.find(a => a.id === previewAvatar)?.name || 'Select an avatar'}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${selectedCategory === 'all' 
                ? 'bg-wordle-correct text-white' 
                : 'bg-surface text-text-muted hover:bg-surface-hover'}
            `}
          >
            All ({AVATARS.length})
          </button>
          {categories.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all
                ${selectedCategory === key 
                  ? 'bg-wordle-correct text-white' 
                  : 'bg-surface text-text-muted hover:bg-surface-hover'}
              `}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto p-2">
          {filteredAvatars.map((avatar) => {
            const isSelected = avatar.id === previewAvatar;
            const isHovered = avatar.id === hoveredAvatar;
            
            return (
              <div
                key={avatar.id}
                className="relative group"
                onMouseEnter={() => setHoveredAvatar(avatar.id)}
                onMouseLeave={() => setHoveredAvatar(null)}
              >
                <button
                  onClick={() => handleSelect(avatar.id)}
                  className={`
                    relative w-full aspect-square rounded-xl p-2
                    transition-all duration-300 transform
                    ${isSelected 
                      ? 'ring-2 ring-wordle-correct ring-offset-2 scale-105' 
                      : 'hover:scale-110 hover:ring-2 hover:ring-border-active'}
                    focus:outline-none focus:ring-2 focus:ring-wordle-correct
                  `}
                  style={{
                    background: isSelected || isHovered ? avatar.gradient : 'var(--card)',
                    boxShadow: isSelected 
                      ? '0 8px 24px rgba(0, 0, 0, 0.2)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                  title={avatar.name}
                >
                  {/* Rotation effect on hover */}
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-500"
                    style={{
                      transform: isHovered ? 'rotateY(360deg)' : 'rotateY(0deg)',
                    }}
                  >
                    <span className="text-2xl sm:text-3xl select-none">
                      {avatar.emoji}
                    </span>
                  </div>
                  
                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-wordle-correct text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
                
                {/* Avatar name tooltip */}
                {isHovered && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-background border border-card-border px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-10">
                    {avatar.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-surface border-2 border-card-border text-foreground rounded-lg font-bold hover:bg-surface-hover transition-all"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default AvatarPicker;
