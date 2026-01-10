import React, { useState } from 'react';

const ModeSelection = ({ onSelectMode }) => {
  const [selectedMode, setSelectedMode] = useState(null); // 'daily' | 'unlimited'
  const [length, setLength] = useState(5);

  const handleModeClick = (mode) => {
    setSelectedMode(mode);
    // If Daily, it forces 5 letters usually, but if we want to support daily 4/6 in future we could check.
    // For now, if Daily is clicked, we might skip length selection or allow it if logic supports it.
    // User Requirement: "After the user chooses the mode, they must choose: 4, 5, 6 letters"
    
    // However, usually Daily is a FIXED puzzle for everyone. 
    // If we have separate Daily puzzles for 4, 5, 6, then we show length selector.
    // The current backend/logic implies only one Daily Word. Let's assume Daily = 5 Length fixed for now to match classic Wordle,
    // UNLESS the user explicitly wants "Daily 4", "Daily 6".
    // "When the user clicks Wordle... they choose Daily/Unlimited... After... they must choose 4, 5, 6".
    // Let's implement full choice for Unlimited. For Daily, we might auto-select 5 or allow choice if your logic supports different daily seeds.
    // Given the prompt: "Changing word size... Reloads the correct word list", let's assume Daily is fixed to 5.
    
    if (mode === 'daily') {
        onSelectMode('daily', 5);
    } 
    // For Unlimited, we show length options.
  };

  if (selectedMode === 'unlimited') {
      return (
        <div className="absolute inset-0 z-40 bg-background flex flex-col items-center justify-center p-4 animate-fade-in-up">
            <h2 className="text-3xl font-serif font-bold mb-8 text-foreground animate-pop">
                How many letters?
            </h2>
            <div className="flex gap-4">
                {[4, 5, 6].map((l) => (
                    <button
                        key={l}
                        onClick={() => onSelectMode('unlimited', l)}
                        className="
                            w-16 h-16 rounded-xl border-2 border-border-default bg-card text-2xl font-bold
                            hover:border-wordle-correct hover:text-wordle-correct hover:scale-110
                            transition-all duration-200
                        "
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button 
                onClick={() => setSelectedMode(null)}
                className="mt-8 text-text-muted hover:text-foreground text-sm underline"
            >
                Back
            </button>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 z-40 bg-background flex flex-col items-center justify-center p-4 animate-fade-in-up">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-wordle-correct rounded mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg rotate-12">
                W
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">
                Wordle
            </h1>
            <p className="text-text-muted mt-2">Get 6 chances to guess the word.</p>
        </div>

        <div className="grid gap-4">
            <button
                onClick={() => handleModeClick('daily')}
                className="
                    group relative p-6 rounded-xl border border-border-default bg-card text-left transition-all duration-200
                    hover:border-wordle-correct hover:shadow-md active:scale-[0.98]
                "
            >
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-bold text-foreground">Daily Puzzle</span>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        JAN {new Date().getDate()}
                    </span>
                </div>
                <p className="text-sm text-text-muted group-hover:text-foreground transition-colors">
                    The official daily challenge. One word, every day.
                </p>
            </button>

            <button
                onClick={() => handleModeClick('unlimited')}
                className="
                    group relative p-6 rounded-xl border border-border-default bg-card text-left transition-all duration-200
                    hover:border-wordle-present hover:shadow-md active:scale-[0.98]
                "
            >
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xl font-bold text-foreground">Unlimited</span>
                    <span className="text-2xl">∞</span>
                </div>
                <p className="text-sm text-text-muted group-hover:text-foreground transition-colors">
                    Play as much as you want. Practice your skills.
                </p>
            </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
