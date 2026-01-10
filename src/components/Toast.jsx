import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'default', onExited }) => {
  // Types: 'default', 'error', 'success'
  // Currently we mostly use black toast for Wordle-like feel
  
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animation in
    const timerIn = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const timerOut = setTimeout(() => {
        setVisible(false);
    }, 2000);
    // Cleanup callback
    const timerExit = setTimeout(() => {
        onExited();
    }, 2300); // 2000 + 300ms transition

    return () => {
        clearTimeout(timerIn);
        clearTimeout(timerOut);
        clearTimeout(timerExit);
    };
  }, [onExited]);

  return (
    <div 
        className={`
            fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-md font-bold text-sm tracking-wide shadow-lg transition-all duration-300 ease-out
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
            bg-[var(--toast-bg)] text-[var(--toast-fg)] border border-[var(--toast-border)]
        `}
    >
      {message}
    </div>
  );
};

export default Toast;
