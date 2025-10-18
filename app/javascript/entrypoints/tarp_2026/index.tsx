import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Type definition for ring configuration
interface RingConfig {
  centerX: number;
  centerY: number;
  maxRadius: number;
  minRadius: number;
  baseOpacity: number;
}

const TarpCanvas2026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw a single wave of ripples with a specific color
  const drawRippleWaveWithColor = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, color: string, opacityRange?: { min: number; max: number }) => {
    const numRipples = 7;
    const edgeMargin = 150; // Distance from edge for outer ripples

    for (let i = 0; i < numRipples; i++) {
      const progress = i / (numRipples - 1); // 0 to 1

      // X position: spread from left edge to right edge
      const x = edgeMargin + (canvasWidth - 2 * edgeMargin) * progress;

      // Y position: wave pattern with peak on left, trough on right
      const waveAmplitude = 100; // Height of the wave
      const wavePhase = progress * 2 * Math.PI; // Creates wave from 0 to 2π (full cycle)
      const baseY = canvasHeight / 2;
      const y = baseY + Math.sin(wavePhase) * waveAmplitude;

      // Size and opacity: largest and most opaque at edges, smallest and least opaque at center
      const sizeProgress = Math.abs(progress - 0.5) * 2; // 1 at edges, 0 at center
      const maxRadius = 200 + (200 * sizeProgress); // 400 at edges, 200 at center
      const minRadius = 25 + (25 * sizeProgress); // 50 at edges, 25 at center

      // Use custom opacity range if provided, otherwise use default
      const baseOpacity = opacityRange
        ? opacityRange.min + (opacityRange.max - opacityRange.min) * sizeProgress
        : 0.3 + (0.2 * sizeProgress); // 0.5 at edges, 0.3 at center

      drawConcentricRingsWithColor(ctx, {
        centerX: x,
        centerY: y,
        maxRadius,
        minRadius,
        baseOpacity,
        color
      });
    }
  };

  // Function to draw concentric rings with a specific color
  const drawConcentricRingsWithColor = (ctx: CanvasRenderingContext2D, config: RingConfig & { color: string }) => {
    const numRings = 7;

    for (let i = 0; i < numRings; i++) {
      // Calculate radius - inner rings closer together, outer rings more spaced
      const progress = i / (numRings - 1);

      // More gradual growth options:
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * progress * progress; // Quadratic (current)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * progress; // Linear (even spacing)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.5); // Power 1.5 (between linear and quadratic)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.3); // Power 1.3 (more gradual than quadratic)
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.1); // Power 1.1 (more gradual than quadratic)

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = 16;
      const minLineWidth = 1;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = config.baseOpacity;
      const minOpacity = 0.1;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Set ring properties with the specified color
      ctx.strokeStyle = config.color.replace('1)', `${opacity})`);
      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(config.centerX, config.centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // Function to draw multiple waves of ripples from top to bottom
  const drawMultipleRippleWaves = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const numWaves = 5;
    const edgeMargin = 100; // Distance from top and bottom edges

    for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
      const waveProgress = waveIndex / (numWaves - 1); // 0 to 1

      // Y position: spread from top edge to bottom edge
      const y = edgeMargin + (canvasHeight - 2 * edgeMargin) * waveProgress;

      // Save the current context state
      ctx.save();

      // Translate to the Y position where we want to draw the wave
      ctx.translate(0, y - canvasHeight / 2);

      // Determine color based on wave index
      const isMiddleWave = waveIndex === 2; // Wave 3 (0-indexed)

      if (isMiddleWave) {
        // Middle wave: bright teal with higher opacity
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, 'rgba(0, 255, 200, 1)', { min: 0.5, max: 0.8 });
      } else {
        // Other waves: lighter blue than base
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, 'rgba(100, 150, 255, 1)');
      }

      // Restore the context state
      ctx.restore();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = 1920;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // Fill canvas with blue background
    ctx.fillStyle = '#0a1f4e';
    ctx.fillRect(0, 0, width, height);

    // Draw multiple waves of ripples from top to bottom
    drawMultipleRippleWaves(ctx, width, height);
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid #ccc',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

// Mount the component to the DOM
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<TarpCanvas2026 />);
  }
});

export default TarpCanvas2026;
