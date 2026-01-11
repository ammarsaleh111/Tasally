'use client';

import React from 'react';

/**
 * FragmentSelector Component
 * Displays word fragments that can be selected to form words
 */
const FragmentSelector = ({
  fragments,
  selectedIndices,
  onFragmentClick,
  disabled = false,
}) => {
  const getFragmentClass = (index, isSelected) => {
    let baseClasses = 'px-4 py-3 text-lg font-bold rounded-xl transition-all duration-200 select-none';
    
    if (isSelected) {
      const selectionOrder = selectedIndices.indexOf(index) + 1;
      baseClasses += ' bg-wordle-correct text-white scale-105 ring-2 ring-green-400 ring-offset-2';
    } else {
      baseClasses += ' bg-surface-secondary text-foreground hover:bg-surface-hover';
    }
    
    if (!disabled) {
      baseClasses += ' cursor-pointer hover:scale-105 active:scale-95';
    } else {
      baseClasses += ' cursor-not-allowed opacity-50';
    }
    
    return baseClasses;
  };

  const handleClick = (index) => {
    if (disabled) return;
    onFragmentClick(index);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
      {fragments.map((fragment, index) => {
        const isSelected = selectedIndices.includes(index);
        const selectionOrder = selectedIndices.indexOf(index);
        
        return (
          <button
            key={index}
            className={getFragmentClass(index, isSelected)}
            onClick={() => handleClick(index)}
            disabled={disabled}
            aria-label={`Fragment "${fragment}"${isSelected ? `, selected as ${selectionOrder + 1}` : ''}`}
          >
            <span className="relative">
              {fragment}
              {isSelected && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {selectionOrder + 1}
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
