'use client';

import { useState } from 'react';

/**
 * HoneycombGrid Component
 * Hexagonal letter layout for Spelling Bee game
 */
export default function HoneycombGrid({ centerLetter, outerLetters, onLetterClick, disabled }) {
  const [clickedLetter, setClickedLetter] = useState(null);

  const handleLetterClick = (letter) => {
    if (disabled) return;
    
    setClickedLetter(letter);
    onLetterClick(letter);
    
    // Reset animation
    setTimeout(() => setClickedLetter(null), 200);
  };

  return (
    <div className="relative flex items-center justify-center" style={{ height: '280px' }}>
      {/* Center Hexagon */}
      <div className="absolute z-10">
        <HexButton
          letter={centerLetter}
          isCenter={true}
          onClick={() => handleLetterClick(centerLetter)}
          isClicked={clickedLetter === centerLetter}
          disabled={disabled}
        />
      </div>

      {/* Outer Hexagons in circle pattern */}
      {outerLetters.map((letter, index) => {
        const angle = (index * 60) - 90; // Start from top, 60° apart
        const radius = 90; // Distance from center
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;

        return (
          <div
            key={`${letter}-${index}`}
            className="absolute"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <HexButton
              letter={letter}
              isCenter={false}
              onClick={() => handleLetterClick(letter)}
              isClicked={clickedLetter === letter}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Individual hexagon button
 */
function HexButton({ letter, isCenter, onClick, isClicked, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-16 h-16 flex items-center justify-center
        text-2xl font-bold uppercase
        transition-all duration-200
        ${isClicked ? 'scale-110' : 'scale-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
        ${isCenter 
          ? 'bg-yellow-400 text-gray-900 dark:text-slate-900 hover:bg-yellow-300' 
          : 'bg-key-bg text-key-text hover:bg-key-bg-hover'
        }
      `}
      style={{
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
      }}
      aria-label={`Letter ${letter}${isCenter ? ' (center)' : ''}`}
    >
      <span className="relative z-10">{letter}</span>
    </button>
  );
}
