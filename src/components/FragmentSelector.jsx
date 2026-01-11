'use client';

import React from 'react';

/**
 * FragmentSelector Component
 * Displays word fragments that can be selected to form words in Combinations game
 */
const FragmentSelector = ({
  fragments,
  selectedIndices,
  onFragmentClick,
  disabled = false,
}) => {
  const handleClick = (index) => {
    if (disabled) return;
    onFragmentClick(index);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full">
      {fragments.map((fragment, index) => {
        const isSelected = selectedIndices.includes(index);
        const selectionOrder = selectedIndices.indexOf(index) + 1;
        
        return (
          <button
            key={index}
            onClick={() => handleClick(index)}
            disabled={disabled}
            aria-label={`Fragment "${fragment}"${isSelected ? `, selected as ${selectionOrder}` : ''}`}
            className={`
              relative px-4 py-4 text-lg font-bold rounded-xl 
              transition-all duration-200 select-none
              ${isSelected 
                ? 'bg-gradient-to-br from-wordle-correct to-green-600 text-white shadow-lg transform scale-105 ring-2 ring-wordle-correct/50' 
                : 'bg-surface text-foreground border-2 border-card-border hover:border-wordle-correct/50 hover:bg-surface-hover'
              }
              ${!disabled && !isSelected ? 'cursor-pointer hover:scale-102 active:scale-95' : ''}
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            <span className="relative inline-flex items-center justify-center gap-1">
              {fragment.toUpperCase()}
              {isSelected && (
                <span className="absolute -top-3 -right-3 w-6 h-6 bg-wordle-present text-black text-xs font-black rounded-full flex items-center justify-center shadow-md animate-bounce-once">
                  {selectionOrder}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FragmentSelector;
