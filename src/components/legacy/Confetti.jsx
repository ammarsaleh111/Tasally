'use client';

/**
 * @deprecated Use WinConfettiOverlay instead.
 * This component uses DOM-based rendering (30 CSS circles) with no physics.
 * Kept for reference only — will be removed in a future release.
 * @see {@link ../WinConfettiOverlay.jsx}
 */

import { useState } from 'react';

function generateParticles() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)]
  }));
}

export default function Confetti() {
  const [particles] = useState(generateParticles);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}
    </div>
  );
}
