import React from 'react';

const Modal = ({ isOpen, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={() => {}} // Could handle click-outside here if desired
      ></div>

      {/* Content */}
      <div className="relative w-full max-w-sm bg-card border border-card-border rounded-xl shadow-2xl p-6 transform transition-all animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-serif font-bold text-center mb-4 text-foreground">
            {title}
        </h2>
        
        <div className="mb-6 text-center text-foreground">
            {children}
        </div>

        {actions && (
            <div className="flex flex-col gap-3">
                {actions}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
