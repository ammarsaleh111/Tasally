import React from 'react';

/**
 * Modal - Unified modal component for all games
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal content
 * @param {React.ReactNode} actions - Modal action buttons
 * @param {function} onClose - Close handler (optional)
 * @param {boolean} wide - Use wider modal (for Learning Log, etc.)
 */
const Modal = ({ isOpen, title, children, actions, onClose, wide = false }) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={handleBackdropClick}
      ></div>

      {/* Content */}
      <div className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-sm'} bg-card border border-card-border rounded-xl shadow-2xl p-6 transform transition-all animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto`}>
        <h2 className="text-2xl font-serif font-bold text-center mb-4 text-foreground">
            {title}
        </h2>
        
        <div className="mb-6 text-foreground">
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
