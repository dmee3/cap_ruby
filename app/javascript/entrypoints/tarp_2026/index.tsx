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

  // Global scaling factor for all dimensions
  const SCALE = 8;

  // Function to draw a single wave of ripples with a specific color
  const drawRippleWaveWithColor = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, color: string, opacityRange?: { min: number; max: number }, isCenterWave?: boolean) => {
    const numRipples = 7;
    const edgeMargin = 150 * SCALE; // Distance from edge for outer ripples

    for (let i = 0; i < numRipples; i++) {
      const progress = i / (numRipples - 1); // 0 to 1

      // X position: spread from left edge to right edge
      const x = edgeMargin + (canvasWidth - 2 * edgeMargin) * progress;

      // Y position: wave pattern with peak on left, trough on right
      const waveAmplitude = 100 * SCALE; // Height of the wave
      const wavePhase = progress * 2 * Math.PI; // Creates wave from 0 to 2π (full cycle)
      const baseY = canvasHeight / 2;
      const y = baseY + Math.sin(wavePhase) * waveAmplitude;

      // Size and opacity: largest and most opaque at edges, smallest and least opaque at center
      const sizeProgress = Math.abs(progress - 0.5) * 2; // 1 at edges, 0 at center
      const maxRadius = (200 + (200 * sizeProgress)) * SCALE; // 400 at edges, 200 at center
      const minRadius = (25 + (25 * sizeProgress)) * SCALE; // 50 at edges, 25 at center

      // Use custom opacity range if provided, otherwise use default
      const baseOpacity = opacityRange
        ? opacityRange.min + (opacityRange.max - opacityRange.min) * sizeProgress
        : 0.3 + (0.2 * sizeProgress); // 0.5 at edges, 0.3 at center

      // Check if this is the 4th ripple (index 3) in the center wave
      const isFourthRipple = isCenterWave && i === 3; // 4th ripple (0-indexed)

      drawConcentricRingsWithColor(ctx, {
        centerX: x,
        centerY: y,
        maxRadius,
        minRadius,
        baseOpacity,
        color
      }, isFourthRipple);
    }
  };

  // Function to draw morse code symbols (dots and dashes) along a circular path
  const drawMorseCodeRing = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, morseCode: string) => {
    const morseMap: { [key: string]: string } = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.',
      'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.',
      'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-',
      'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '?': '..--..'
    };

    // Convert text to morse code - each letter becomes its morse code
    const text = "CANYOUHEARME?";
    const morseText = text.split('').map(char => morseMap[char.toUpperCase()] || char).join(' ');

    console.log('Morse text:', morseText); // Debug log

    // Base morse code symbol dimensions
    const baseDotSize = 2; // Base radius of dots
    const baseDashWidth = 5; // Base width of dashes
    const baseDashHeight = 4; // Base height of dashes
    const baseSymbolSpacing = 5; // Base space between symbols
    const baseLetterSpacing = 8; // Base space between letters

    // Calculate total width needed for all symbols at base size
    let totalWidth = 0;
    for (let i = 0; i < morseText.length; i++) {
      const char = morseText[i];
      if (char === ' ') {
        totalWidth += baseLetterSpacing;
      } else if (char === '.') {
        totalWidth += (baseDotSize * 2) + baseSymbolSpacing;
      } else if (char === '-') {
        totalWidth += baseDashWidth + baseSymbolSpacing;
      }
    }

    // Calculate available circumference (use 98% of full circle to get very close to full circle)
    const circumference = 2 * Math.PI * radius;
    const availableWidth = circumference * 0.98; // Use 98% of circle

    // Calculate scale factor to fit all text within the available space
    const scaleFactor = Math.min(SCALE, availableWidth / totalWidth);

    // Apply scale factor to dimensions
    const dotSize = baseDotSize * scaleFactor;
    const dashWidth = baseDashWidth * scaleFactor;
    const dashHeight = baseDashHeight * scaleFactor;
    const symbolSpacing = baseSymbolSpacing * scaleFactor;
    const letterSpacing = baseLetterSpacing * scaleFactor;

    // Start angle to center the text
    const startAngle = -Math.PI / 2; // Start at top of circle

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 200, 0.8)'; // Bright teal color

    let currentAngle = startAngle;

    for (let i = 0; i < morseText.length; i++) {
      const char = morseText[i];
      const x = centerX + Math.cos(currentAngle) * radius;
      const y = centerY + Math.sin(currentAngle) * radius;

      // Calculate rotation angle for the symbol
      const rotationAngle = currentAngle + Math.PI / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotationAngle);

      if (char === '.') {
        // Draw a dot (circle)
        ctx.beginPath();
        ctx.arc(0, 0, dotSize, 0, 2 * Math.PI);
        ctx.fill();
      } else if (char === '-') {
        // Draw a dash (pill shape with rounded ends)
        const halfWidth = dashWidth / 2;
        const halfHeight = dashHeight / 2;
        const radius = halfHeight; // Use half height as the radius for rounded ends

        ctx.beginPath();
        // Start from the left rounded end
        ctx.arc(-halfWidth, 0, radius, Math.PI / 2, -Math.PI / 2, false);
        // Draw the top edge
        ctx.lineTo(halfWidth, -halfHeight);
        // Draw the right rounded end
        ctx.arc(halfWidth, 0, radius, -Math.PI / 2, Math.PI / 2, false);
        // Draw the bottom edge
        ctx.lineTo(-halfWidth, halfHeight);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Move to next position (only if not the last character)
      if (i < morseText.length - 1) {
        let spacing = 0;
        if (char === ' ') {
          spacing = letterSpacing;
        } else if (char === '.') {
          spacing = (dotSize * 2) + symbolSpacing;
        } else if (char === '-') {
          spacing = dashWidth + symbolSpacing;
        }
        currentAngle += (spacing * 2 * Math.PI) / circumference;
      }
    }

    ctx.restore();
  };

  // Function to draw concentric rings with a specific color
  const drawConcentricRingsWithColor = (ctx: CanvasRenderingContext2D, config: RingConfig & { color: string }, isCenterWave?: boolean) => {
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
      const maxLineWidth = 16 * SCALE;
      const minLineWidth = 1 * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = config.baseOpacity;
      const minOpacity = 0.1;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Special handling for innermost ring of center wave
      if (isCenterWave && i === 0) {
        console.log('Drawing morse code ring at:', config.centerX, config.centerY, radius); // Debug log
        // Draw morse code ring for innermost ring of center wave
        drawMorseCodeRing(ctx, config.centerX, config.centerY, radius, "CAN YOU HEAR ME?");
      } else {
        // Draw normal ring
        ctx.strokeStyle = config.color.replace('1)', `${opacity})`);
        ctx.lineWidth = lineWidth;

        // Draw the ring
        ctx.beginPath();
        ctx.arc(config.centerX, config.centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // Function to draw multiple waves of ripples from top to bottom
  const drawMultipleRippleWaves = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const numWaves = 5;
    const edgeMargin = 100 * SCALE; // Distance from top and bottom edges

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
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, 'rgba(0, 255, 200, 1)', { min: 0.5, max: 0.8 }, true);
      } else {
        // Other waves: lighter blue than base
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, 'rgba(100, 150, 255, 1)', undefined, false);
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
    const width = 1920 * SCALE;
    const height = 1080 * SCALE;
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
