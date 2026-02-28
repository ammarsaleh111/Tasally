'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Theme-Aware Palette Detection ──────────────────────────────────────────

const THEME_PALETTES = {
  halloween: ['#ff6600', '#8b00ff', '#00cc44', '#ffcc00', '#ff3333'],
  christmas: ['#cc0000', '#006600', '#ffcc00', '#ffffff', '#ff6666'],
  ramadan:   ['#c0a040', '#2e7d32', '#f5f5dc', '#1a237e', '#ffd54f'],
  'world-cup': ['#00529b', '#ffd700', '#e8112d', '#ffffff', '#00a651'],
  'sports-week': ['#ff4500', '#1e90ff', '#ffd700', '#32cd32', '#ff69b4'],
  'music-week': ['#9b59b6', '#e74c3c', '#3498db', '#f39c12', '#1abc9c'],
  'oscar-week': ['#ffd700', '#c0c0c0', '#cd7f32', '#ffffff', '#2c2c2c'],
};

function getThemePalette() {
  if (typeof document === 'undefined') return null;
  const theme = document.documentElement.dataset.theme;
  return theme && THEME_PALETTES[theme] ? THEME_PALETTES[theme] : null;
}

// ─── CSS Variable Resolver ───────────────────────────────────────────────────
// Canvas fillStyle cannot resolve CSS custom properties (hsl(var(--x))) —
// they silently fall back to black. This reads the computed value at runtime.

function resolveCSSColor(color) {
  if (typeof document === 'undefined' || !color) return color;
  // Already a concrete color (hex, rgb, named, hsl without var, etc.)
  if (!color.includes('var(--')) return color;
  // Extract variable name from patterns like: hsl(var(--name)) or hsl(var(--name) / 0.5)
  const match = color.match(/var\((--[^,)\s]+)/);
  if (!match) return '#6366f1';
  const varName = match[1];
  const computed = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!computed) return '#6366f1';
  // The CSS variable usually stores just the HSL channels, e.g. "142 72% 50%"
  // Wrap in hsl() if it looks like bare channels, otherwise return as-is
  return computed.startsWith('#') || computed.startsWith('rgb') || computed.startsWith('hsl')
    ? computed
    : `hsl(${computed})`;
}

function resolvePalette(palette) {
  if (!palette?.length) return null;
  return palette.map(resolveCSSColor);
}

// ─── Default Palette (concrete hex values — always work on canvas) ───────────

const CHEERFUL_PALETTE = [
  '#ff0a54', // vibrant pink
  '#ff7096', // soft pink
  '#ff9e00', // vibrant orange
  '#ffd166', // bright yellow
  '#06d6a0', // teal green
  '#118ab2', // bright blue
  '#8338ec', // vibrant purple
  '#22c55e', // lime green
  '#f5bf00', // gold
];

const DEFAULT_PALETTE = CHEERFUL_PALETTE;

// ─── Origins ────────────────────────────────────────────────────────────────

const ORIGINS = {
  top: 'top',
  corners: 'corners',
  edges: 'edges',
  bottom: 'bottom',
};

// ─── Shape Types ────────────────────────────────────────────────────────────

const DEFAULT_SHAPES = ['rect', 'circle'];

// ─── Per-Game Confetti Profiles ─────────────────────────────────────────────

export const CONFETTI_PROFILES = {
  wordle: {
    palette: CHEERFUL_PALETTE,
    shapes: ['rect', 'star'],
    origin: ORIGINS.corners,
    intensity: 1.0,
    durationMs: 3200,
    perfectShapes: ['star', 'star', 'diamond'],
  },
  connections: {
    palette: CHEERFUL_PALETTE,
    shapes: ['diamond', 'rect'],
    origin: ORIGINS.edges,
    intensity: 1.2,
    durationMs: 3000,
    perfectShapes: ['diamond', 'star'],
  },
  crossword: {
    palette: CHEERFUL_PALETTE,
    shapes: ['ring', 'rect'],
    origin: ORIGINS.top,
    intensity: 0.8,
    durationMs: 3500,
    perfectShapes: ['ring', 'star'],
  },
  numbers: {
    palette: CHEERFUL_PALETTE,
    shapes: ['diamond', 'circle'],
    origin: ORIGINS.corners,
    intensity: 1.5,
    durationMs: 2800,
    perfectShapes: ['diamond', 'star', 'circle'],
  },
  trivia: {
    palette: CHEERFUL_PALETTE,
    shapes: ['star', 'rect', 'circle'],
    origin: ORIGINS.top,
    intensity: 1.0,
    durationMs: 3000,
    perfectShapes: ['star', 'star', 'star'],
  },
  spelling: {
    palette: CHEERFUL_PALETTE,
    shapes: ['star', 'circle'],
    origin: ORIGINS.corners,
    intensity: 1.3,
    durationMs: 3200,
    perfectShapes: ['star', 'circle', 'ribbon'],
  },
  strands: {
    palette: CHEERFUL_PALETTE,
    shapes: ['ribbon', 'star'],
    origin: ORIGINS.edges,
    intensity: 1.1,
    durationMs: 3000,
    perfectShapes: ['ribbon', 'star'],
  },
  waffle: {
    palette: CHEERFUL_PALETTE,
    shapes: ['ribbon', 'rect'],
    origin: ORIGINS.top,
    intensity: 0.9,
    durationMs: 3500,
    perfectShapes: ['ribbon', 'rect', 'star'],
  },
  combinations: {
    palette: CHEERFUL_PALETTE,
    shapes: ['rect', 'circle', 'ribbon', 'star', 'diamond', 'ring'],
    origin: ORIGINS.corners,
    intensity: 2.0,
    durationMs: 4000,
    perfectShapes: ['star', 'diamond', 'ribbon', 'ring'],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getRandom = (min, max) => Math.random() * (max - min) + min;

const pickShape = (shapes) => {
  const available = shapes?.length ? shapes : DEFAULT_SHAPES;
  return available[Math.floor(Math.random() * available.length)];
};

// ─── Particle Factory ───────────────────────────────────────────────────────

const createParticles = (count, width, height, palette, origin, shapes, waveIndex = 0) => {
  const colors = palette?.length ? palette : DEFAULT_PALETTE;
  const useCorners = origin === ORIGINS.corners;
  const useEdges = origin === ORIGINS.edges;
  const useBottom = origin === ORIGINS.bottom;

  // Slight variation per wave
  const velocityMultiplier = 1 + waveIndex * 0.12;
  const spawnJitter = waveIndex * 0.05;

  return Array.from({ length: count }, () => {
    const fromLeft = useCorners || useEdges ? Math.random() < 0.5 : false;

    let startX, startY;
    if (useBottom) {
      startX = getRandom(width * 0.3, width * 0.7);
      startY = height + getRandom(0, 20);
    } else if (useCorners || useEdges) {
      startX = fromLeft
        ? getRandom(0, width * 0.2)
        : getRandom(width * 0.8, width);
      startY = useEdges
        ? getRandom(height * 0.05, height * 0.2)
        : getRandom(-height * 0.2, 0);
    } else {
      startX = getRandom(0, width);
      startY = getRandom(-height * 0.2, 0);
    }

    // Add spawn jitter per wave
    startX += getRandom(-width * spawnJitter, width * spawnJitter);

    const shape = pickShape(shapes);
    const size = shape === 'circle' || shape === 'ring'
      ? getRandom(2, 5)
      : shape === 'ribbon'
        ? getRandom(2, 3)
        : shape === 'star' || shape === 'diamond'
          ? getRandom(3, 6)
          : getRandom(2, 4);

    let vx, vy;
    if (useBottom) {
      vx = getRandom(-60, 60);
      vy = getRandom(-250, -140) * velocityMultiplier;
    } else if (useCorners || useEdges) {
      vx = getRandom(fromLeft ? 10 : -50, fromLeft ? 50 : -10) * velocityMultiplier;
      vy = getRandom(60, 160) * velocityMultiplier;
    } else {
      vx = getRandom(-25, 25) * velocityMultiplier;
      vy = getRandom(60, 160) * velocityMultiplier;
    }

    return {
      x: startX,
      y: startY,
      vx,
      vy,
      gravity: getRandom(80, 180),
      drag: getRandom(0.97, 0.995),
      wobbleAmplitude: getRandom(0, 40),
      wobbleFrequency: getRandom(1.5, 4),
      wobblePhase: getRandom(0, Math.PI * 2),
      rotation: getRandom(0, Math.PI * 2),
      rotationSpeed: getRandom(-8, 8),
      rotationInertia: getRandom(0.98, 0.999),
      size,
      width: shape === 'rect' ? size : shape === 'ribbon' ? size * 0.6 : size * 2,
      height: shape === 'rect' ? getRandom(6, 14) : shape === 'ribbon' ? getRandom(12, 22) : size * 2,
      shape,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: getRandom(0.75, 1),
      life: 0,
    };
  });
};

// ─── Shape Drawing ──────────────────────────────────────────────────────────

const drawShape = (ctx, particle) => {
  const { shape, size, width: w, height: h } = particle;

  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'rect':
      ctx.fillRect(-w / 2, -h / 2, w, h);
      break;

    case 'ribbon': {
      const ribbonW = w;
      const ribbonH = h;
      ctx.beginPath();
      ctx.moveTo(-ribbonW / 2, -ribbonH / 2);
      ctx.quadraticCurveTo(ribbonW * 0.3, 0, -ribbonW / 2, ribbonH / 2);
      ctx.lineTo(ribbonW / 2, ribbonH / 2);
      ctx.quadraticCurveTo(-ribbonW * 0.3, 0, ribbonW / 2, -ribbonH / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'star': {
      const spikes = 5;
      const outerR = size;
      const innerR = size * 0.45;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'diamond': {
      const dw = size * 0.7;
      const dh = size;
      ctx.beginPath();
      ctx.moveTo(0, -dh);
      ctx.lineTo(dw, 0);
      ctx.lineTo(0, dh);
      ctx.lineTo(-dw, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'ring': {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.lineWidth = size * 0.35;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
      break;
    }

    default:
      ctx.fillRect(-w / 2, -h / 2, w, h);
  }
};

// ─── Reduced Motion Hook ────────────────────────────────────────────────────

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

// ─── Device Capability Detection ────────────────────────────────────────────

const getMaxParticles = () => {
  if (typeof navigator === 'undefined') return 120;
  const cores = navigator.hardwareConcurrency || 4;
  if (cores < 4) return 60;
  if (cores < 8) return 120;
  return 180;
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WinConfettiOverlay({
  active = false,
  palette,
  durationMs = 3000,
  intensity = 1,
  origin = ORIGINS.top,
  shapes,
  isPerfect = false,
  gameName,
  onDone,
  className = '',
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);
  const startRef = useRef(0);
  const lastFrameRef = useRef(0);
  const wavesSpawnedRef = useRef(0);
  const megaBurstFiredRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Resolve profile if gameName is provided
  const profile = gameName ? CONFETTI_PROFILES[gameName] : null;
  const resolvedPalette = palette || profile?.palette;
  const resolvedOrigin = origin !== ORIGINS.top ? origin : (profile?.origin || origin);
  const resolvedIntensity = intensity !== 1 ? intensity : (profile?.intensity || intensity);
  const resolvedShapes = shapes || (isPerfect && profile?.perfectShapes) || profile?.shapes;
  const resolvedDuration = durationMs !== 3000 ? durationMs : (profile?.durationMs || durationMs);

  const maxParticles = useMemo(() => getMaxParticles(), []);

  const particleCount = useMemo(() => {
    const base = 40;
    const scaled = Math.round(base * Math.max(0.4, Math.min(2.5, resolvedIntensity)));
    return Math.min(maxParticles, Math.max(16, scaled));
  }, [resolvedIntensity, maxParticles]);

  // Stable onDone callback
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const handleDone = useCallback(() => {
    onDoneRef.current?.();
  }, []);

  useEffect(() => {
    if (!active) {
      wavesSpawnedRef.current = 0;
      megaBurstFiredRef.current = false;
      return;
    }

    if (prefersReducedMotion) {
      handleDone();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const displayWidth = canvas.parentElement?.getBoundingClientRect()?.width || canvas.width;
    const displayHeight = canvas.parentElement?.getBoundingClientRect()?.height || canvas.height;

    // Detect theme palette, then resolve all CSS variables to real colors for canvas
    const themePalette = getThemePalette();
    const rawPalette = themePalette || resolvedPalette || DEFAULT_PALETTE;
    const effectivePalette = resolvePalette(rawPalette) || DEFAULT_PALETTE;

    // Wave 1 — immediate
    const waveCount = Math.ceil(particleCount / 3);
    particlesRef.current = createParticles(
      waveCount, displayWidth, displayHeight,
      effectivePalette, resolvedOrigin, resolvedShapes, 0
    );
    wavesSpawnedRef.current = 1;

    startRef.current = performance.now();
    lastFrameRef.current = startRef.current;

    // Schedule wave 2 & 3
    const wave2Timer = setTimeout(() => {
      if (wavesSpawnedRef.current < 2) {
        const newParticles = createParticles(
          waveCount, displayWidth, displayHeight,
          effectivePalette, resolvedOrigin, resolvedShapes, 1
        );
        particlesRef.current = [...particlesRef.current, ...newParticles];
        wavesSpawnedRef.current = 2;
      }
    }, 300);

    const wave3Timer = setTimeout(() => {
      if (wavesSpawnedRef.current < 3) {
        const remaining = particleCount - particlesRef.current.length;
        if (remaining > 0) {
          const newParticles = createParticles(
            remaining, displayWidth, displayHeight,
            effectivePalette, resolvedOrigin, resolvedShapes, 2
          );
          particlesRef.current = [...particlesRef.current, ...newParticles];
        }
        wavesSpawnedRef.current = 3;
      }
    }, 700);

    // Schedule mega burst for perfect wins
    let megaTimer;
    if (isPerfect) {
      megaTimer = setTimeout(() => {
        if (!megaBurstFiredRef.current) {
          megaBurstFiredRef.current = true;
          const megaShapes = profile?.perfectShapes || ['star', 'star', 'diamond'];
          const megaParticles = createParticles(
            Math.min(30, maxParticles - particlesRef.current.length),
            displayWidth, displayHeight,
            effectivePalette,
            ORIGINS.bottom,
            megaShapes,
            0
          );
          particlesRef.current = [...particlesRef.current, ...megaParticles];
        }
      }, 1000);
    }

    const maxDuration = resolvedDuration + (isPerfect ? 1500 : 0);

    const render = (timestamp) => {
      const elapsed = timestamp - startRef.current;
      const deltaMs = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      const deltaSeconds = Math.min(deltaMs / 1000, 0.05);
      const progress = Math.min(elapsed / maxDuration, 1);
      const fadeStart = 0.7;
      const fadeProgress = progress > fadeStart ? (progress - fadeStart) / (1 - fadeStart) : 0;
      const globalAlpha = 1 - fadeProgress;

      context.clearRect(0, 0, displayWidth, displayHeight);

      let anyVisible = false;

      particlesRef.current.forEach((p) => {
        p.life += deltaSeconds;

        // Physics: variable gravity
        p.vy += p.gravity * deltaSeconds;

        // Horizontal drag
        p.vx *= Math.pow(p.drag, deltaSeconds * 60);

        // Sinusoidal wobble (wind effect)
        const wobbleOffset = p.wobbleAmplitude * Math.sin(p.wobbleFrequency * p.life + p.wobblePhase);
        p.x += (p.vx + wobbleOffset) * deltaSeconds;
        p.y += p.vy * deltaSeconds;

        // Rotational inertia
        p.rotation += p.rotationSpeed * deltaSeconds;
        p.rotationSpeed *= Math.pow(p.rotationInertia, deltaSeconds * 60);

        // Skip if off-screen
        if (p.y > displayHeight + 30 || p.x < -30 || p.x > displayWidth + 30) return;

        anyVisible = true;

        context.save();
        context.globalAlpha = Math.max(0, p.alpha * globalAlpha);
        context.translate(p.x, p.y);
        context.rotate(p.rotation);
        context.fillStyle = p.color;

        drawShape(context, p);

        context.restore();
      });

      // Hard stop: 5 seconds max safety or natural end
      if (progress < 1 && (elapsed < 5000 || anyVisible)) {
        frameRef.current = requestAnimationFrame(render);
      } else {
        handleDone();
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
      clearTimeout(wave2Timer);
      clearTimeout(wave3Timer);
      if (megaTimer) clearTimeout(megaTimer);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
      particlesRef.current = [];
    };
  }, [active, resolvedDuration, resolvedIntensity, resolvedOrigin, resolvedPalette, resolvedShapes,
      particleCount, prefersReducedMotion, handleDone, isPerfect, maxParticles, profile?.perfectShapes]);

  if (!active || prefersReducedMotion) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none will-change-transform ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Accessible announcement */}
      <div className="sr-only" aria-live="polite">
        Congratulations, you won!
      </div>
    </div>
  );
}

export { ORIGINS as CONFETTI_ORIGINS };
