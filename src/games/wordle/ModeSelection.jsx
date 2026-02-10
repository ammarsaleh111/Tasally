import React, { useState } from "react";

/**
 * @param {Object} props
 * @param {(mode: "daily" | "unlimited", length: 4 | 5 | 6) => void} props.onSelectMode
 * @param {boolean} [props.isGroupGame]
 * @param {string} [props.groupName]
 */
const ModeSelection = ({ onSelectMode, isGroupGame = false, groupName }) => {
  const [selectedMode, setSelectedMode] = useState(null); // null | 'daily' | 'unlimited'
  const effectiveMode = isGroupGame ? "unlimited" : selectedMode;

  const handleModeClick = (mode) => {
    if (mode === "daily") {
      onSelectMode("daily", 5);
      return;
    }
    setSelectedMode("unlimited");
  };

  if (effectiveMode === "unlimited") {
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background p-4 animate-fade-in-up">
        {isGroupGame && groupName ? (
          <div className="mb-4 rounded-full border border-info/30 bg-info/10 px-3 py-1.5 text-sm font-medium text-info">
            Group: {groupName}
          </div>
        ) : null}

        <h2 className="mb-8 text-3xl font-serif font-bold text-foreground animate-pop">How many letters?</h2>

        <div className="mt-10 flex w-full justify-center gap-4">
          {[4, 5, 6].map((length) => (
            <button
              key={length}
              onClick={() => onSelectMode("unlimited", length)}
              className="h-16 w-16 rounded-xl border-2 border-border-default bg-card text-2xl font-bold transition-all duration-200 hover:scale-110 hover:border-wordle-correct hover:text-wordle-correct"
            >
              {length}
            </button>
          ))}
        </div>

        {!isGroupGame ? (
          <button onClick={() => setSelectedMode(null)} className="mt-8 text-sm text-text-muted underline hover:text-foreground">
            Back
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 rotate-12 items-center justify-center rounded bg-wordle-correct text-3xl font-bold text-white shadow-lg">
            W
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">Wordle</h1>
          <p className="mt-2 text-text-muted">Get 6 chances to guess the word.</p>
        </div>

        <div className="mt-10 grid w-full items-center justify-center gap-4">
          <button
            onClick={() => handleModeClick("daily")}
            className="group relative rounded-xl border border-border-default bg-card p-6 text-center transition-all duration-200 hover:border-wordle-correct hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-2 flex flex-col items-center gap-2">
              <span className="text-xl font-bold text-foreground">Daily Puzzle</span>
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-text-muted transition-colors group-hover:text-foreground">The official daily challenge. One word, every day.</p>
          </button>

          <button
            onClick={() => handleModeClick("unlimited")}
            className="group relative rounded-xl border border-border-default bg-card p-6 text-center transition-all duration-200 hover:border-wordle-present hover:shadow-md active:scale-[0.98]"
          >
            <div className="mb-2 flex flex-col items-center gap-2">
              <span className="text-xl font-bold text-foreground">Unlimited</span>
              <span className="text-sm font-semibold uppercase tracking-wide text-text-muted">Free play</span>
            </div>
            <p className="text-sm text-text-muted transition-colors group-hover:text-foreground">Play as much as you want. Practice your skills.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;
