import React from 'react';
import { LETTER_STATUS } from '../games/wordle/wordleLogic';

const WordleGrid = ({ guesses, currentGuess, turn, status }) => {
  const empties = 
    guesses.length < 6 ? Array.from(Array(5 - guesses.length)) : [];

  return (
    <div className="grid grid-rows-6 gap-1.5 mb-6">
      {guesses.map((guess, i) => (
        <CompletedRow key={i} guess={guess} />
      ))}
      {guesses.length < 6 && <CurrentRow guess={currentGuess} />}
      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </div>
  );
};

const CompletedRow = ({ guess }) => {
  // guess object structure: { word: "HELLO", evaluation: ["correct", "absent", ...] }
  
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {guess.word.split('').map((letter, i) => (
        <div
          key={i}
          className={`
            w-14 h-14 border-2 flex items-center justify-center text-3xl font-bold text-white capitalize
            ${guess.evaluation[i] === LETTER_STATUS.CORRECT ? 'bg-wordle-correct border-wordle-correct' : ''}
            ${guess.evaluation[i] === LETTER_STATUS.PRESENT ? 'bg-wordle-present border-wordle-present' : ''}
            ${guess.evaluation[i] === LETTER_STATUS.ABSENT ? 'bg-wordle-absent border-wordle-absent' : ''}
            animate-[flip-in_0.5s_ease-in-out_backwards]
          `}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
};

const CurrentRow = ({ guess }) => {
  const splitGuess = guess.split('');
  const emptyCells = Array.from(Array(5 - splitGuess.length));

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {splitGuess.map((letter, i) => (
        <div
          key={i}
          className="w-14 h-14 border-2 border-slate-500 flex items-center justify-center text-3xl font-bold dark:text-white capitalize animate-pulse-short"
        >
          {letter}
        </div>
      ))}
      {emptyCells.map((_, i) => (
        <div
          key={i}
          className="w-14 h-14 border-2 border-wordle-tile-border flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
};

const EmptyRow = () => {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {Array.from(Array(5)).map((_, i) => (
        <div
          key={i}
          className="w-14 h-14 border-2 border-wordle-tile-border flex items-center justify-center"
        ></div>
      ))}
    </div>
  );
};

export default WordleGrid;
