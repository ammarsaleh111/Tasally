import React from 'react';
import Modal from './Modal';

const HowToPlay = ({ isOpen, onClose }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      title="How To Play"
    >
      <div className="space-y-4 text-left">
        <p className="text-foreground">
          Guess the hidden word in 6 tries.
        </p>
        
        <p className="text-foreground">
          Each guess must be a valid 5 letter word, you cannot enter random letters.
          Hit the enter button to submit the guess.
        </p>

        <p className="text-foreground">
          After your submission, the color of the tiles will change as in the examples below.
        </p>

        <div className="border-t border-border-default pt-4">
          <h3 className="font-bold mb-3 text-foreground">Examples</h3>
          
          {/* Example 1 - Correct Letter */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              {['G', 'A', 'M', 'E', 'S'].map((letter, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 border-2 flex items-center justify-center text-lg font-bold ${
                    i === 0 
                      ? 'bg-wordle-correct border-wordle-correct text-[hsl(var(--button-text))]' 
                      : 'border-border-default text-foreground'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground">
              The letter <strong>G</strong> is in the word and in the correct spot.
            </p>
          </div>

          {/* Example 2 - Wrong Position */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              {['H', 'O', 'T', 'E', 'L'].map((letter, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 border-2 flex items-center justify-center text-lg font-bold ${
                    i === 1 
                      ? 'bg-wordle-present border-wordle-present text-[hsl(var(--button-text))]' 
                      : 'border-border-default text-foreground'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground">
              The letter <strong>O</strong> is in the word but in the wrong spot.
            </p>
          </div>

          {/* Example 3 - Not in Word */}
          <div className="mb-4">
            <div className="flex gap-1 mb-2">
              {['C', 'L', 'I', 'C', 'K'].map((letter, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 border-2 flex items-center justify-center text-lg font-bold ${
                    i === 2 
                      ? 'bg-wordle-absent border-wordle-absent text-[hsl(var(--button-text))]' 
                      : 'border-border-default text-foreground'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-sm text-foreground">
              The letter <strong>I</strong> is not in the word in any spot.
            </p>
          </div>
        </div>

        <p className="text-sm font-semibold text-foreground border-t border-border-default pt-4">
          Unlimited wordle games all day long!
        </p>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-[hsl(var(--button-primary))] text-[hsl(var(--button-text))] font-bold hover:bg-[hsl(var(--button-primary-hover))] transition-all"
        >
          Got It!
        </button>
      </div>
    </Modal>
  );
};

export default HowToPlay;
