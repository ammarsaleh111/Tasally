import Link from 'next/link';
import React from 'react';

const GameHeader = ({ title, onHowToPlay, onStats }) => {
  return (
    <header className="w-full border-b border-border-default pb-6 mb-6 pt-6 bg-background/80 backdrop-blur sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/games" className="text-sm text-text-muted hover:text-foreground transition-colors">
              ← Games
            </Link>
            {onHowToPlay && (
              <button
                onClick={onHowToPlay}
                className="text-sm text-text-muted hover:text-foreground transition-colors"
              >
                ❓ How to Play
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-wider font-serif text-foreground text-center absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h1>
          <div className="flex items-center gap-4 flex-1 justify-end">
            {onStats && (
              <button
                onClick={onStats}
                className="text-sm text-text-muted hover:text-foreground transition-colors"
              >
                📊 Stats
              </button>
            )}
            <Link href="/" className="text-sm text-text-muted hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameHeader;
