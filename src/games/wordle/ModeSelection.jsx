import React, { useState, useEffect } from 'react';

/**
 * ModeSelection Component
 * 
 * @param {function} onSelectMode - Callback when mode is selected (mode, length)
 * @param {boolean} isGroupGame - If true, skip daily option and go straight to word length
 * @param {string} groupName - Optional group name to display
 */
const ModeSelection = ({ onSelectMode, isGroupGame = false, groupName }) => {
  const [selectedMode, setSelectedMode] = useState(null); // null | 'daily' | 'unlimited'
  const [length, setLength] = useState(5);

  // If playing from a group, go directly to word length selection
  useEffect(() => {
    if (isGroupGame) {
      setSelectedMode('unlimited');
    }
  }, [isGroupGame]);

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
            {isGroupGame && groupName && (
              <div className="mb-4 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium">
                👥 {groupName}
              </div>
            )}
            <h2 className="text-3xl font-serif font-bold mb-8 text-foreground animate-pop">
                How many letters?
            </h2>
            <div className="flex gap-4 justify-center w-full mt-100">
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
            {/* Only show back button if not from a group (can choose daily mode) */}
            {!isGroupGame && (
              <button 
                  onClick={() => setSelectedMode(null)}
                  className="mt-8 text-text-muted hover:text-foreground text-sm underline"
              >
                  Back
              </button>
            )}
        </div>
      );
  }

  return (
    <div className="absolute inset-0 z-40 bg-background flex flex-col items-center justify-center p-4" >
      <div className="max-w-md w-full space-y-6 flex flex-col items-center justify-center mx-auto" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: "none",         
      translate: "none",          
      willChange: "auto",
    }}>
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-wordle-correct rounded mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg rotate-12">
                W
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">
                Wordle
            </h1>
            <p className="text-text-muted mt-2">Get 6 chances to guess the word.</p>
        </div>

        <div className="grid gap-4 flex-col w-full justify-center items-center mt-100">
            <button
                onClick={() => handleModeClick('daily')}
                className="
                    group relative p-6 rounded-xl border border-border-default bg-card text-center transition-all duration-200
                    hover:border-wordle-correct hover:shadow-md active:scale-[0.98]
                "
            >
                <div className="flex flex-col items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-foreground">Daily Puzzle</span>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).toUpperCase()}
                    </span>
                </div>
                <p className="text-sm text-text-muted group-hover:text-foreground transition-colors">
                    The official daily challenge. One word, every day.
                </p>
            </button>

            <button
                onClick={() => handleModeClick('unlimited')}
                className="
                    group relative p-6 rounded-xl border border-border-default bg-card text-center transition-all duration-200
                    hover:border-wordle-present hover:shadow-md active:scale-[0.98]
                "
            >
                <div className="flex flex-col items-center gap-2 mb-2">
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
