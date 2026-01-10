import React from 'react';

const GroupBar = ({ group, isAnimating = false }) => {
  const colorConfig = {
    yellow: 'bg-[#f9df6d] text-black',
    green: 'bg-[#a0c35a] text-black',
    blue: 'bg-[#b0c4ef] text-black',
    purple: 'bg-[#ba81c5] text-white'
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
