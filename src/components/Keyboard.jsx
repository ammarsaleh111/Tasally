import React from 'react';
import { LETTER_STATUS } from '../games/wordle/wordleLogic';

const Keyboard = React.memo(({ onKey, keyStatuses, disabled = false }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  const getKeyStyle = (key) => {
    const status = keyStatuses[key];
    switch (status) {
      case LETTER_STATUS.CORRECT:
        return 'bg-wordle-correct text-[var(--button-text)] border-transparent';
      case LETTER_STATUS.PRESENT:
        return 'bg-wordle-present text-[var(--button-text)] border-transparent';
      case LETTER_STATUS.ABSENT:
        return 'bg-wordle-absent text-[var(--button-text)] border-transparent';
      default:
        return 'bg-key text-key-fg hover:bg-key-hover active:scale-95 transition-all duration-150 shadow-sm';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-2">
      {rows.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 mb-2">
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === 'BACKSPACE';
            const handleClick = () => {
              if (disabled) return;
              onKey(key);
            };

            return (
              <button
                key={key}
                onClick={handleClick}
                disabled={disabled}
                className={`${isWide ? 'px-3 sm:px-4 text-xs font-bold' : 'px-2 sm:px-3.5 font-bold'} 
                  h-14 rounded transition-colors flex items-center justify-center
                  ${disabled ? 'opacity-60 cursor-not-allowed' : getKeyStyle(key)}
                `}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default Keyboard;
