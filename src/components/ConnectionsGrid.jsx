import React from 'react';

const ConnectionsGrid = React.memo(({ 
  words, 
  selectedWords, 
  onWordClick, 
  isShaking = false,
  disabled = false 
}) => {
  const isSelected = (word) => selectedWords.includes(word);
  
  return (
    <div className={`
      grid grid-cols-4 gap-1.5 w-full max-w-xl mx-auto mb-6
      ${isShaking ? 'animate-shake' : ''}
    `}>
      {words.map((word, index) => (
        <button
          key={`${word}-${index}`}
          onClick={() => !disabled && onWordClick(word)}
          disabled={disabled}
          className={`
            h-16 flex items-center justify-center
            rounded-lg font-bold text-xs sm:text-sm
            transition-all duration-200
            border-2
            ${isSelected(word) 
              ? 'bg-foreground text-background border-foreground scale-95' 
              : 'bg-card border-card-border text-foreground hover:bg-surface-hover active:scale-95'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="px-1.5 text-center uppercase tracking-tight leading-tight">
            {word}
          </span>
        </button>
      ))}
    </div>
  );
});

ConnectionsGrid.displayName = 'ConnectionsGrid';

export default ConnectionsGrid;
