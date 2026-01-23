import React, { useEffect, useState } from 'react';

const noop = () => {};

const Toast = ({ message, type = 'default', duration = 2000, onExited = noop }) => {
  // Types: 'default', 'error', 'success'
  // Currently we mostly use black toast for Wordle-like feel
  
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation in
    const timerIn = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const timerOut = setTimeout(() => {
      setVisible(false);
    }, duration);
    // Cleanup callback
    const timerExit = setTimeout(() => {
      onExited();
    }, duration + 300);

    return () => {
        clearTimeout(timerIn);
        clearTimeout(timerOut);
        clearTimeout(timerExit);
    };
    }, [duration, onExited]);

  return (
    <div 
        className={`
            fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-md font-bold text-sm tracking-wide shadow-lg transition-all duration-300 ease-out
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
            bg-[hsl(var(--toast-bg))] text-[hsl(var(--toast-fg))] border border-[hsl(var(--toast-border))]
        `}
    >
      {message}
    </div>
  );
};

export default Toast;
