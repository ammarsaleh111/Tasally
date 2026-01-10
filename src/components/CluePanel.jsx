import React, { useRef, useEffect } from 'react';

const CluePanel = ({ puzzle, activeClue, direction, onClueClick, solvedWords = new Set() }) => {
  const activeClueRef = useRef(null);
  
  useEffect(() => {
    if (activeClueRef.current) {
      activeClueRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeClue, direction]);
  const acrossClues = Object.entries(puzzle.across || {}).map(([num, clue]) => ({
    number: parseInt(num),
    clue
  }));
  
  const downClues = Object.entries(puzzle.down || {}).map(([num, clue]) => ({
    number: parseInt(num),
    clue
  }));
  
  const isWordSolved = (number, dir) => {
    return solvedWords.has(`${dir}-${number}`);
  };
  
  return (
    <div className="w-full grid grid-cols-1 gap-4">
      {/* Across Clues */}
      <div>
        <h3 className="font-bold text-base mb-2 text-foreground">ACROSS</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
          {acrossClues.map(({ number, clue }) => {
            const isActive = direction === 'across' && activeClue === number;
            const isSolved = isWordSolved(number, 'across');
            
            return (
              <button
                key={`across-${number}`}
                ref={isActive ? activeClueRef : null}
                onClick={() => onClueClick(number, 'across')}
                className={`
                  w-full text-left p-2 rounded transition-all duration-150
                  flex items-center gap-2 text-sm
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900 font-semibold scale-[1.02]'
                    : 'hover:bg-surface-hover'
                  }
                  ${isSolved ? 'opacity-60' : ''}
                `}
              >
                <div className="flex-1">
                  <span className="font-bold text-foreground">{number}.</span>{' '}
                  <span className="text-text-muted">{clue}</span>
                </div>
                {isSolved && (
                  <svg className="w-4 h-4 text-wordle-correct flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Down Clues */}
      <div>
        <h3 className="font-bold text-base mb-2 text-foreground">DOWN</h3>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
          {downClues.map(({ number, clue }) => {
            const isActive = direction === 'down' && activeClue === number;
            const isSolved = isWordSolved(number, 'down');
            
            return (
              <button
                key={`down-${number}`}
                ref={isActive ? activeClueRef : null}
                onClick={() => onClueClick(number, 'down')}
                className={`
                  w-full text-left p-2 rounded transition-all duration-150
                  flex items-center gap-2 text-sm
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900 font-semibold scale-[1.02]'
                    : 'hover:bg-surface-hover'
                  }
                  ${isSolved ? 'opacity-60' : ''}
                `}
              >
                <div className="flex-1">
                  <span className="font-bold text-foreground">{number}.</span>{' '}
                  <span className="text-text-muted">{clue}</span>
                </div>
                {isSolved && (
                  <svg className="w-4 h-4 text-wordle-correct flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CluePanel;
