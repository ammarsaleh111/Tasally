'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_PALETTE = [
  'hsl(var(--wordle-correct))',
  'hsl(var(--wordle-present))',
  'hsl(var(--info))',
  'hsl(var(--success))'
];

const ORIGINS = {
  top: 'top',
  corners: 'corners',
  edges: 'edges',
};

const getRandom = (min, max) => Math.random() * (max - min) + min;

const createParticles = (count, width, height, palette, origin) => {
  const colors = palette?.length ? palette : DEFAULT_PALETTE;
  const useCorners = origin === ORIGINS.corners;
  const useEdges = origin === ORIGINS.edges;

  return Array.from({ length: count }, (_, i) => {
    const fromLeft = useCorners || useEdges ? Math.random() < 0.5 : false;
    const startX = useCorners || useEdges
      ? (fromLeft ? getRandom(0, width * 0.2) : getRandom(width * 0.8, width))
      : getRandom(0, width);
    const startY = useEdges
      ? getRandom(height * 0.05, height * 0.2)
      : getRandom(-height * 0.2, 0);
    const shape = Math.random() < 0.6 ? 'rect' : 'circle';
    const size = shape === 'circle' ? getRandom(2, 4) : getRandom(2, 3.5);

    return {
      id: `confetti-${i}-${Date.now()}`,
      x: startX,
      y: startY,
      vx: useCorners || useEdges ? getRandom(fromLeft ? 10 : -40, fromLeft ? 40 : -10) : getRandom(-20, 20),
      vy: getRandom(60, 140),
      rotation: getRandom(0, Math.PI * 2),
      rotationSpeed: getRandom(-6, 6),
      size,
      width: shape === 'rect' ? size : size * 2,
      height: shape === 'rect' ? getRandom(6, 12) : size * 2,
      shape,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: getRandom(0.75, 1),
    };
  });
};

const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReduced;
};

export default function WinConfettiOverlay({
  active = false,
  palette,
  durationMs = 3000,
  intensity = 1,
  origin = ORIGINS.top,
  onDone,
  className = '',
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const particleCount = useMemo(() => {
    const base = 40;
    const scaled = Math.round(base * Math.max(0.4, Math.min(2.2, intensity)));
    return Math.min(120, Math.max(16, scaled));
  }, [intensity]);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (prefersReducedMotion) {
      onDone?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();

    particlesRef.current = createParticles(
      particleCount,
      canvas.width,
      canvas.height,
      palette,
      origin
    );
    startRef.current = performance.now();
    lastFrameRef.current = startRef.current;
    const render = (timestamp) => {
      const elapsed = timestamp - startRef.current;
      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      const deltaSeconds = Math.min(deltaMs / 1000, 0.05);
      const progress = Math.min(elapsed / durationMs, 1);
      const fadeStart = 0.75;
      const fadeProgress = progress > fadeStart ? (progress - fadeStart) / (1 - fadeStart) : 0;
      const globalAlpha = 1 - fadeProgress;

      context.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.vy += 10 * deltaSeconds;
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;
        particle.rotation += particle.rotationSpeed * deltaSeconds;

        if (particle.y > canvas.height + 20) return;

        context.save();
        context.globalAlpha = particle.alpha * globalAlpha;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;

        if (particle.shape === 'circle') {
          context.beginPath();
          context.arc(0, 0, particle.size, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        }

        context.restore();
      });

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(render);
      } else {
        onDone?.();
      }
    };

    frameRef.current = requestAnimationFrame(render);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      if (canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement);
      }
    } else {
      window.addEventListener('resize', resize);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
    };
  }, [active, durationMs, intensity, origin, palette, particleCount, prefersReducedMotion, onDone]);

  if (!active || prefersReducedMotion) return null;

  return (
    <div
      className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export { ORIGINS as CONFETTI_ORIGINS };
