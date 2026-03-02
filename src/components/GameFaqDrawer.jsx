'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/**
 * FAQ Drawer — slides in from the right on desktop, from the bottom on mobile.
 * Controlled entirely by `isOpen` / `onClose` props.
 * When closed it is completely removed from the visual flow (display:none after animation).
 */
export default function GameFaqDrawer({ isOpen, onClose, title, faqs = [], moreHref = '/faq' }) {
  const panelRef = useRef(null);

  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — right sidebar on lg+, full-screen sheet on mobile */}
      <aside
        ref={panelRef}
        className="
          absolute inset-y-0 right-0
          w-full max-w-md
          bg-[hsl(var(--background))]
          border-l border-[hsl(var(--border))]
          shadow-2xl
          flex flex-col
          animate-in slide-in-from-right duration-200
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--foreground))]"
            aria-label="Close FAQ"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FAQ list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-3">
            {faqs.slice(0, 4).map((faq) => (
              <details key={faq.question} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[hsl(var(--foreground))]">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href={moreHref}
              onClick={onClose}
              className="inline-flex items-center rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--surface-hover))]"
            >
              More FAQs
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
