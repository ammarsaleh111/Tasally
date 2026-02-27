/**
 * Generates PWA icons (192x192, 512x512, maskable variants) as PNG files.
 * Uses only built-in Node.js modules — no external dependencies required.
 * Run: node scripts/generate-pwa-icons.js
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// CRC32 implementation (needed for PNG chunks)
// ──────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ──────────────────────────────────────────────
// Minimal PNG encoder
// ──────────────────────────────────────────────
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  // Build IHDR (13 bytes: width, height, bitDepth=8, colorType=6 (RGBA), ...)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  // bytes 10-12 default to 0

  // Build raw scanlines with filter byte 0 (None) prepended
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: None
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ──────────────────────────────────────────────
// Drawing helpers
// ──────────────────────────────────────────────
function fillBackground(buf, w, h, r, g, b) {
  for (let i = 0; i < w * h; i++) {
    buf[i * 4 + 0] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = 255;
  }
}

function fillRect(buf, W, x, y, w, h, r, g, b, radius = 0) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      if (px < 0 || px >= W || py < 0) continue;

      // Rounded corner check
      if (radius > 0) {
        const dx = Math.min(px - x, x + w - 1 - px);
        const dy = Math.min(py - y, y + h - 1 - py);
        if (dx < radius && dy < radius) {
          const distSq = (radius - dx - 1) ** 2 + (radius - dy - 1) ** 2;
          if (distSq > radius * radius) continue;
        }
      }

      const idx = (py * W + px) * 4;
      buf[idx + 0] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;
    }
  }
}

// ──────────────────────────────────────────────
// Icon generator
// Design: 4 coloured tiles (like Connections) on deep-navy background
//   Green  | Yellow
//   Blue   | Purple
// ──────────────────────────────────────────────
//   Brand colours from design system (HSL→hex approx):
//     Green  : #4ade80  (142 43% 54%)
//     Yellow : #facc15  (48  88% 52%)
//     Blue   : #60a5fa  (217 91% 68%)
//     Purple : #c084fc  (290 35% 60%)
//     BG     : #0f1729  (222 47% 11%)
// ──────────────────────────────────────────────
const COLORS = [
  [0x4a, 0xde, 0x80], // green
  [0xfa, 0xcc, 0x15], // yellow
  [0x60, 0xa5, 0xfa], // blue
  [0xc0, 0x84, 0xfc], // purple
];
const BG = [0x0f, 0x17, 0x29];

function generateIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  fillBackground(buf, size, size, BG[0], BG[1], BG[2]);

  const safePad = maskable
    ? Math.round(size * 0.14)   // wider safe zone for maskable
    : Math.round(size * 0.08);

  const gap = Math.max(3, Math.round(size * 0.025));
  const tileSize = Math.floor((size - 2 * safePad - gap) / 2);
  const radius = Math.max(4, Math.round(tileSize * 0.12));

  const xs = [safePad, safePad + tileSize + gap];
  const ys = [safePad, safePad + tileSize + gap];

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const [r, g, b] = COLORS[row * 2 + col];
      fillRect(buf, size, xs[col], ys[row], tileSize, tileSize, r, g, b, radius);
    }
  }

  return encodePNG(size, size, buf);
}

// ──────────────────────────────────────────────
// Write files
// ──────────────────────────────────────────────
const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

const files = [
  ['icon-192.png',      () => generateIcon(192, false)],
  ['icon-512.png',      () => generateIcon(512, false)],
  ['maskable-192.png',  () => generateIcon(192, true)],
  ['maskable-512.png',  () => generateIcon(512, true)],
];

for (const [name, gen] of files) {
  const dest = path.join(iconsDir, name);
  fs.writeFileSync(dest, gen());
  console.log(`✓  Created ${path.relative(path.resolve(__dirname, '..'), dest)}`);
}

console.log('\nPWA icons ready in public/icons/');
