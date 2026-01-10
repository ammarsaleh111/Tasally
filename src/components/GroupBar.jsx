import React from 'react';

const GroupBar = ({ group, isAnimating = false }) => {
  const colorConfig = {
    yellow: 'bg-[var(--connections-yellow)] text-[var(--connections-text-light)]',
    green: 'bg-[var(--connections-green)] text-[var(--connections-text-light)]',
    blue: 'bg-[var(--connections-blue)] text-[var(--connections-text-light)]',
    purple: 'bg-[var(--connections-purple)] text-[var(--connections-text-dark)]'
  };

  return (
    <div 
      className={`
        w-full rounded-lg p-4 mb-2
        ${colorConfig[group.color]}
        ${isAnimating ? 'animate-fade-in-up' : ''}
        transition-all duration-300
      `}
    >
      <div className="text-center">
        <h3 className="font-bold text-lg mb-1 uppercase tracking-wide">
          {group.theme}
        </h3>
        <p className="text-sm font-medium">
          {group.words.join(', ')}
        </p>
      </div>
    </div>
  );
};

export default GroupBar;
