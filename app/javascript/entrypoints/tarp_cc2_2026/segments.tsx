import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { SCALE, CONFIG } from './config';
import { drawInterlockingRings } from './patterns/rings';
import { drawGreekKey } from './patterns/greekKey';
import { drawOctagons } from './patterns/octagons';
import { drawCurvedTowers } from './patterns/curvedTowers';
import { drawArtDecoPattern } from './patterns/artDeco';

// ---------------------------------------------------------------------------
// COLOR CONFIGURATION — edit these to experiment with colors.
// Each entry has a `background` and a `primary` (the pattern line / shape color).
// ---------------------------------------------------------------------------
const SEGMENT_COLORS = {
  rings: { background: '#000', primary: '#444' },
  greekKey: { background: '#000', primary: '#444' },
  octagons: { background: '#000', primary: '#444' },
  curvedTowers: { background: '#000', primary: '#444' },
  artDeco: { background: '#000', primary: '#444' },
} as const;

// ---------------------------------------------------------------------------
// PATTERN SCALE — multiplier applied to every pattern's size parameter.
// 1 = same scale as the ribbons on the main tarp, 2 = twice as large, etc.
// ---------------------------------------------------------------------------
const PATTERN_SCALE = 3;

// ---------------------------------------------------------------------------
// CANVAS DIMENSIONS (pixels)
// ---------------------------------------------------------------------------
const SEG_WIDTH = 20000;
const SEG_HEIGHT = 4000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CC2Segments: React.FC = () => {
  const ringsRef = useRef<HTMLCanvasElement>(null);
  const greekKeyRef = useRef<HTMLCanvasElement>(null);
  const octagonsRef = useRef<HTMLCanvasElement>(null);
  const curvedTowersRef = useRef<HTMLCanvasElement>(null);
  const artDecoRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // --- Rings ---
    if (ringsRef.current) {
      const canvas = ringsRef.current;
      canvas.width = SEG_WIDTH;
      canvas.height = SEG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawInterlockingRings(
          ctx, 0, 0, SEG_WIDTH, SEG_HEIGHT, 0,
          SEGMENT_COLORS.rings.primary,
          SEGMENT_COLORS.rings.background,
          CONFIG.patterns.rings.ringRadius * PATTERN_SCALE * .5,
          0,    // no inset
          2,  // line width multiplier
          true  // inset all sides (no-op when inset is 0)
        );
      }
    }

    // --- Greek Key ---
    if (greekKeyRef.current) {
      const canvas = greekKeyRef.current;
      canvas.width = SEG_WIDTH;
      canvas.height = SEG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawGreekKey(
          ctx, 0, 0, SEG_WIDTH, SEG_HEIGHT, 0,
          SEGMENT_COLORS.greekKey.primary,
          SEGMENT_COLORS.greekKey.background,
          CONFIG.patterns.greekKey.keySize * PATTERN_SCALE,
          0,    // no inset
          2,  // line width multiplier
          true  // inset all sides
        );
      }
    }

    // --- Octagons ---
    if (octagonsRef.current) {
      const canvas = octagonsRef.current;
      canvas.width = SEG_WIDTH;
      canvas.height = SEG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawOctagons(
          ctx, 0, 0, SEG_WIDTH, SEG_HEIGHT, 0,
          SEGMENT_COLORS.octagons.primary,
          SEGMENT_COLORS.octagons.background,
          CONFIG.patterns.octagons.octagonSize * PATTERN_SCALE,
          0,    // no inset
          true, // inset all sides
          1.2   // line width multiplier
        );
      }
    }

    // --- Curved Towers ---
    if (curvedTowersRef.current) {
      const canvas = curvedTowersRef.current;
      canvas.width = SEG_WIDTH;
      canvas.height = SEG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCurvedTowers(
          ctx, 0, 0, SEG_WIDTH, SEG_HEIGHT, 0,
          SEGMENT_COLORS.curvedTowers.primary,
          SEGMENT_COLORS.curvedTowers.background,
          CONFIG.patterns.curvedTowers.tileSize * PATTERN_SCALE,
          0,    // no inset
          1.5,  // line width multiplier
          true  // inset all sides
        );
      }
    }

    // --- Art Deco ---
    if (artDecoRef.current) {
      const canvas = artDecoRef.current;
      canvas.width = SEG_WIDTH;
      canvas.height = SEG_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawArtDecoPattern(
          ctx, 0, 0, SEG_WIDTH, SEG_HEIGHT, 0,
          SEGMENT_COLORS.artDeco.primary,
          SEGMENT_COLORS.artDeco.background,
          CONFIG.patterns.artDeco.gridSize * PATTERN_SCALE,
          0,    // no inset
          2   // line width multiplier
        );
      }
    }
  }, []);

  const canvasStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    maxWidth: '100%',
    height: 'auto',
  };

  const labels = [
    { name: 'Rings', ref: ringsRef, colors: SEGMENT_COLORS.rings },
    { name: 'Greek Key', ref: greekKeyRef, colors: SEGMENT_COLORS.greekKey },
    { name: 'Octagons', ref: octagonsRef, colors: SEGMENT_COLORS.octagons },
    { name: 'Curved Towers', ref: curvedTowersRef, colors: SEGMENT_COLORS.curvedTowers },
    { name: 'Art Deco', ref: artDecoRef, colors: SEGMENT_COLORS.artDeco },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '40px', background: '#111', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', margin: 0 }}>CC2 2026 — Pattern Segments</h1>
      <p style={{ color: '#aaa', margin: 0 }}>Each segment is {SEG_WIDTH.toLocaleString()} × {SEG_HEIGHT.toLocaleString()} px</p>

      {labels.map(({ name, ref, colors }) => (
        <div key={name} style={{ width: '100%', maxWidth: '1200px' }}>
          <div style={{ color: '#fff', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 0 4px 0' }}>{name}</h3>
            <span style={{ color: '#888', fontSize: '13px' }}>
              bg: <code style={{ color: '#ccc' }}>{colors.background}</code>
              {' '}  primary: <code style={{ color: '#ccc' }}>{colors.primary}</code>
            </span>
          </div>
          <canvas ref={ref} style={canvasStyle} />
        </div>
      ))}
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    createRoot(container).render(<CC2Segments />);
  }
});

export default CC2Segments;
