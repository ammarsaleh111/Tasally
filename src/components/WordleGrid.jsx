import React from 'react';
import { LETTER_STATUS, MAX_GUESSES } from '../games/wordle/wordleLogic';

const WordleGrid = React.memo(({ guesses, currentGuess, length = 5, isShaking = false, isChecking = false, gameStatus }) => {
  const hasActiveRow = guesses.length < MAX_GUESSES && gameStatus === 'playing';
  // Solution row removed per user request - checking logic handled in parent
  const placeholderCount = Math.max(0, MAX_GUESSES - guesses.length - (hasActiveRow ? 1 : 0));
  const empties = Array.from({ length: placeholderCount });
  
  // Calculate grid max-width based on scaling to keep tiles roughly similar size
  const getMaxWidth = () => {
    switch(length) {
        case 4: return 'max-w-[280px]'; // Narrower for 4 letters
        case 6: return 'max-w-[400px]'; // Narrower for 6 letters
        default: return 'max-w-[340px]'; // Narrower for 5 letters
    }
  };

  return (
    <div className={`w-full ${getMaxWidth()} mx-auto gap-1.5 mb-6 flex flex-col`}>
      {guesses.map((guess, i) => (
        <CompletedRow key={guess.id ?? i} guess={guess} length={length} />
      ))}
      {hasActiveRow && <CurrentRow guess={currentGuess} length={length} isShaking={isShaking} isChecking={isChecking} />}
      {empties.map((_, i) => (
        <EmptyRow key={i} length={length} />
      ))}
    </div>
  );
});
WordleGrid.displayName = 'WordleGrid';

const getGridColsStyle = (length) => {
    switch(length) {
        case 4: return 'grid-cols-4';
        case 6: return 'grid-cols-6';
        default: return 'grid-cols-5';
    }
}

const CompletedRow = React.memo(({ guess, length }) => {
  // Check if this is a winning row (all tiles correct)
  const isWinningRow = guess.evaluation?.every(status => status === LETTER_STATUS.CORRECT);
  
  return (
    <div className="relative w-full">
      <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full ${isWinningRow ? 'animate-bounce-once' : ''}`}>
        {guess.word.split('').map((letter, i) => (
          <div
            key={i}
            className={`
              aspect-square w-full border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold text-[hsl(var(--button-text))] capitalize
              ${guess.evaluation[i] === LETTER_STATUS.CORRECT ? 'bg-wordle-correct border-wordle-correct' : ''}
              ${guess.evaluation[i] === LETTER_STATUS.PRESENT ? 'bg-wordle-present border-wordle-present' : ''}
              ${guess.evaluation[i] === LETTER_STATUS.ABSENT ? 'bg-wordle-absent border-wordle-absent' : ''}
              animate-flip
            `}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {letter}
          </div>
        ))}
      </div>
    </div>
  );
});
CompletedRow.displayName = 'CompletedRow';

const CurrentRow = React.memo(({ guess, length, isShaking = false, isChecking = false }) => {
  const splitGuess = guess.split('');
  const emptyCount = Math.max(0, length - splitGuess.length);
  const emptyCells = Array.from(Array(emptyCount));

  return (
    <div className={`relative w-full`}>
      {isChecking && (
         <div className="absolute -top-6 w-full text-center text-xs font-bold text-text-muted animate-pulse tracking-widest uppercase">
           Checking...
         </div>
      )}
      <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full ${isShaking ? 'animate-shake' : ''}`}>
        {splitGuess.map((letter, i) => (
          <div
            key={i}
            className={`aspect-square w-full border-2 border-border-active flex items-center justify-center text-2xl sm:text-3xl font-bold text-foreground capitalize ${isChecking ? 'opacity-70 bg-surface-hover' : 'animate-pop'}`}
          >
            {letter}
          </div>
        ))}
        {emptyCells.map((_, i) => (
          <div
            key={i}
            className="aspect-square w-full border-2 border-border-default flex items-center justify-center"
          ></div>
        ))}
      </div>
    </div>
  );
});
CurrentRow.displayName = 'CurrentRow';

const EmptyRow = React.memo(({ length }) => {
  return (
    <div className={`grid ${getGridColsStyle(length)} gap-1.5 w-full`}>
      {Array.from(Array(length)).map((_, i) => (
        <div
          key={i}
          className="aspect-square w-full border-2 border-border-default flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
});
EmptyRow.displayName = 'EmptyRow';

export default WordleGrid;
