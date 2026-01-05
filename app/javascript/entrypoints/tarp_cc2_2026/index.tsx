import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Tarp dimensions in feet
const TARP_WIDTH_FEET = 84;
const TARP_HEIGHT_FEET = 42;

// Convert to inches (base unit: 1 pixel = 1 inch at SCALE = 1)
const TARP_WIDTH_INCHES = TARP_WIDTH_FEET * 12;  // 1,008 inches
const TARP_HEIGHT_INCHES = TARP_HEIGHT_FEET * 12; // 504 inches

// Scale factor: pixels per inch
// SCALE = 1: 1,008 × 504 px (1 pixel per inch, print-ready)
// SCALE = 10: 10,080 × 5,040 px (10 pixels per inch, high-res)
const SCALE = 4;

// Configuration constants
const CONFIG = {
  colors: {
    background: '#3a3a3a', // Dark grey background
    threads: '#000000', // Black threads
  },
  weave: {
    warpThreads: {
      count: 1200, // Number of warp threads (one direction)
      angle: 26.57, // Angle in degrees (lower-left to upper-right diagonal, arctan(42/84))
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches (some span most of canvas)
    },
    weftThreads: {
      count: 1200, // Number of weft threads (other direction)
      angle: 153.43, // Complementary angle in degrees (180 - 26.57)
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches
    },
    baseWidth: 2, // Base width in inches at center of thread
    opacity: 0.6, // Base opacity for threads
    seed: 54321, // Seed for reproducible randomness
    variation: {
      positionOffset: 0.15, // Position offset from grid (0-1, as fraction of spacing)
      thicknessVariation: 0.2, // Thickness variation (0.8-1.2x)
      curveAmount: 0.3, // How much threads curve at intersections (in thread widths)
    },
  },
  ribbons: {
    width: 5, // Ribbon width in feet (perpendicular to ribbon direction)
    spacingMultiplier: 3.2, // Ribbon spacing as multiple of ribbon width (16 feet center-to-center)
    // Ribbon layers drawn in array order (first = bottom layer, last = top layer)
    layers: [
      // Center warp ribbon
      {
        direction: 'warp' as const,
        position: 'center' as const,
        shift: 0,
        segmentArray: [
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
        ],
      },
      // Above weft ribbon
      {
        direction: 'weft' as const,
        position: 'above' as const,
        shift: -8,
        segmentArray: [
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
        ],
      },
      // Below weft ribbon
      {
        direction: 'weft' as const,
        position: 'below' as const,
        shift: 8,
        segmentArray: [
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
        ],
      },
      // Above warp ribbon
      {
        direction: 'warp' as const,
        position: 'above' as const,
        shift: 8,
        segmentArray: [
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
        ],
      },
      // Below warp ribbon
      {
        direction: 'warp' as const,
        position: 'below' as const,
        shift: -8,
        segmentArray: [
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
        ],
      },
      // Center weft ribbon
      {
        direction: 'weft' as const,
        position: 'center' as const,
        shift: 0,
        segmentArray: [
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
          { pattern: 'rings' as const, length: 20, seed: 456, colors: { background: '#acaba7', primary: '#415463', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, seed: 234, colors: { background: '#e8dcc8', primary: '#5a5a5a', accent: '#5a5a5a' } },
          { pattern: 'octagons' as const, length: 20, seed: 789, colors: { background: '#162745', primary: '#dec573', accent: '#5a5a5a' } },
          { pattern: 'rectangles' as const, length: 20, seed: 5, colors: { background: '#a8c0d0', primary: ['#8a8a8a', '#6a6a6a', '#4a4a4a'] as const, accent: '#415463' } },
        ],
      },
    ],
  },
  patterns: {
    rings: {
      ringRadius: 24, // Radius in inches
    },
    greekKey: {
      keySize: 32, // Size of each key unit in inches
    },
    rectangles: {
      // No global parameters needed
    },
    octagons: {
      octagonSize: 16, // Size in inches
    },
  },
  topography: {
    sampleRate: 0.0625, // Sample size as fraction of spacing (1/16)
    scaleMultiplier: 1.5, // Height map scale as multiple of spacing
  },
} as const;

const TarpCC22026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Seeded random number generator for reproducible patterns
  const createSeededRandom = (seed: number) => {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  };

  // Function to draw a single thread with tapered ends
  const drawThread = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    angle: number,
    baseWidth: number
  ) => {
    const halfLength = length / 2;

    // Calculate start and end points
    const startX = x - Math.cos(angle) * halfLength;
    const startY = y - Math.sin(angle) * halfLength;
    const endX = x + Math.cos(angle) * halfLength;
    const endY = y + Math.sin(angle) * halfLength;

    // Draw the thread as a tapered line using a path
    const numSegments = 20;
    ctx.beginPath();

    // Draw upper edge of the thread
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const currentX = startX + (endX - startX) * t;
      const currentY = startY + (endY - startY) * t;

      // Taper: width is 0 at ends (t=0, t=1) and maxWidth at center (t=0.5)
      // Using a sine wave for smooth tapering
      const widthMultiplier = Math.sin(t * Math.PI);
      const currentWidth = baseWidth * widthMultiplier / 2;

      // Offset perpendicular to the thread direction
      const offsetX = currentX - Math.sin(angle) * currentWidth;
      const offsetY = currentY + Math.cos(angle) * currentWidth;

      if (i === 0) {
        ctx.moveTo(offsetX, offsetY);
      } else {
        ctx.lineTo(offsetX, offsetY);
      }
    }

    // Draw lower edge of the thread (in reverse)
    for (let i = numSegments; i >= 0; i--) {
      const t = i / numSegments;
      const currentX = startX + (endX - startX) * t;
      const currentY = startY + (endY - startY) * t;

      const widthMultiplier = Math.sin(t * Math.PI);
      const currentWidth = baseWidth * widthMultiplier / 2;

      const offsetX = currentX + Math.sin(angle) * currentWidth;
      const offsetY = currentY - Math.cos(angle) * currentWidth;

      ctx.lineTo(offsetX, offsetY);
    }

    ctx.closePath();
    ctx.fill();
  };

  // Function to draw interlocking rings pattern
  const drawInterlockingRings = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number, // Rotation angle of the pattern in degrees
    ringColor: string,
    borderColor: string,
    backgroundColor: string,
    ringRadius: number = 6, // Radius of each ring in inches
    seed: number = 42 // Seed for reproducible randomness
  ) => {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Fill background color first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const ringRadiusPx = ringRadius * SCALE;
    const spacing = ringRadiusPx * 1.6; // Distance between ring centers

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const numCols = Math.ceil(width / spacing) + 2;
    const numRows = Math.ceil(height / spacing) + 2;

    // Draw rings in segments to create interlocking effect
    const segments = [0, 2, 4, 6, 1, 3, 5, 7]; // segment * 45° gives start angle
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const startAngle = segment * Math.PI / 4; // 0°, 90°, 180°, 270°
      const endAngle = startAngle + Math.PI / 4; // 45-degree arc

      for (let row = -1; row < numRows; row++) {
        for (let col = -1; col < numCols; col++) {
          const centerX = col * spacing;
          const centerY = row * spacing;

          // Draw border segment (outer ring)
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = SCALE * 4.4; // Wider for border
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadiusPx, startAngle, endAngle);
          ctx.stroke();

          // Draw main ring segment (inner) - extended by 0.5° on each side to close gaps
          const innerExtension = 0.5 * Math.PI / 180; // 0.5 degrees in radians
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = SCALE * 2.2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadiusPx, startAngle - innerExtension, endAngle + innerExtension);
          ctx.stroke();
        }
      }
    }

    // Draw topographical opacity overlay
    drawTopographicalOverlay(ctx, width, height, backgroundColor, seed, spacing);

    ctx.restore();
  };

  // Function to draw Greek key pattern
  const drawGreekKey = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number, // Rotation angle of the pattern in degrees
    color1: string,
    backgroundColor: string,
    keySize: number = 8, // Size of each key unit in inches
    seed: number = 42 // Seed for reproducible randomness
  ) => {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Fill background color first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const patternSize = keySize * SCALE;

    ctx.lineWidth = SCALE * 1.6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = color1;

    let rowIndex = 0;
    let baseY = 0;
    while (baseY < height) {
      // Offset every other row by half a pattern width
      const xOffset = (rowIndex % 2 === 1) ? patternSize / 2 : 0;
      let baseX = xOffset - patternSize; // Start one pattern to the left

      while (baseX < width + patternSize) { // Draw a bit beyond edge to handle offset
        drawGreekKeyUnit(ctx, baseX, baseY, patternSize);
        baseX += patternSize;
      }

      baseY += patternSize * 7 / 8;
      rowIndex++;
    }

    // Draw topographical opacity overlay
    drawTopographicalOverlay(ctx, width, height, backgroundColor, seed, patternSize);

    ctx.restore();
  }

  const drawGreekKeyUnit = (
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    patternSize: number
  ) => {
    ctx.save();
    // Square outline
    const inset = patternSize / 7;

    ctx.beginPath();
    // Upper Left Spiral
    ctx.moveTo(baseX + inset * 2, baseY + inset * 2);
    ctx.lineTo(baseX + inset * 3, baseY + inset * 2);
    ctx.lineTo(baseX + inset * 3, baseY + inset * 3);
    ctx.lineTo(baseX + inset * 1, baseY + inset * 3);
    ctx.lineTo(baseX + inset * 1, baseY + inset * 1);
    ctx.lineTo(baseX + inset * 4, baseY + inset * 1);

    // Vertical line
    ctx.lineTo(baseX + inset * 4, baseY + inset * 6);

    // Lower Left Spiral
    ctx.lineTo(baseX + inset * 1, baseY + inset * 6);
    ctx.lineTo(baseX + inset * 1, baseY + inset * 4);
    ctx.lineTo(baseX + inset * 3, baseY + inset * 4);
    ctx.lineTo(baseX + inset * 3, baseY + inset * 5);
    ctx.lineTo(baseX + inset * 2, baseY + inset * 5);
    ctx.stroke();

    // Upper Right Spiral
    ctx.moveTo(baseX + inset * 6, baseY + inset * 2);
    ctx.lineTo(baseX + inset * 5, baseY + inset * 2);
    ctx.lineTo(baseX + inset * 5, baseY + inset * 3);
    ctx.lineTo(baseX + inset * 7, baseY + inset * 3);
    ctx.lineTo(baseX + inset * 7, baseY + inset * 1);
    ctx.lineTo(baseX + inset * 4, baseY + inset * 1);
    ctx.stroke();

    // Lower Right Spiral
    ctx.moveTo(baseX + inset * 4, baseY + inset * 6);
    ctx.lineTo(baseX + inset * 7, baseY + inset * 6);
    ctx.lineTo(baseX + inset * 7, baseY + inset * 4);
    ctx.lineTo(baseX + inset * 5, baseY + inset * 4);
    ctx.lineTo(baseX + inset * 5, baseY + inset * 5);
    ctx.lineTo(baseX + inset * 6, baseY + inset * 5);
    ctx.stroke();
    ctx.restore();
  };

  // Function to draw random rectangles pattern (Mondrian-style)
  const drawRandomRectangles = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number, // Rotation angle of the pattern in degrees
    primary: readonly string[], // Array of primary colors to use
    accent: string, // Accent color to add variety
    background: string,
    seed: number = 42 // Seed for reproducible randomness
  ) => {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Fill background color first
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    // Use proper seeded random (same as elsewhere in the codebase)
    const random = createSeededRandom(seed);

    // Generate rectangles with intentional placement that appears random
    const numRectangles = 10;
    const rectangles: Array<{ x: number; y: number; w: number; h: number; color: string }> = [];

    for (let i = 0; i < numRectangles; i++) {
      // Create well-distributed positions using a combination of grid and offset
      const gridCols = 3;
      const gridRows = 3;
      const cellWidth = width / gridCols;
      const cellHeight = height / gridRows;

      // Use grid position with random offset for better distribution
      const gridX = (i % gridCols) * cellWidth;
      const gridY = Math.floor(i / gridCols) * cellHeight;
      const offsetX = (random() - 0.5) * cellWidth * 0.8;
      const offsetY = (random() - 0.5) * cellHeight * 0.8;

      let rectX = gridX + offsetX;
      let rectY = gridY + offsetY;

      // Generate rectangle dimensions with aspect ratio constraint (max 3:1 ratio)
      const baseSize = Math.min(width, height) * (random() * 0.15 + 0.15); // 15-30% of smaller dimension
      const aspectRatio = random() * 2 + 0.5; // 0.5 to 2.5, then clamped to 3:1 max
      const clampedAspect = Math.min(aspectRatio, 3);

      let rectWidth, rectHeight;
      if (random() > 0.5) {
        rectWidth = baseSize * clampedAspect;
        rectHeight = baseSize;
      } else {
        rectWidth = baseSize;
        rectHeight = baseSize * clampedAspect;
      }

      // Pick a random color from grayscale colors, with occasional accent
      const useAccent = random() < 0.2; // 20% chance to use accent color
      let rectColor: string;
      if (useAccent) {
        rectColor = accent;
      } else {
        const colorIndex = Math.floor(random() * primary.length);
        rectColor = primary[colorIndex];
      }

      // Check for color collision with overlapping rectangles
      // Also enforce minimum overlap requirement (if overlapping, must be at least 5% of either rect)
      // And prevent one rectangle being mostly inside another (max 80% containment)
      let hasColorCollision = false;
      for (const existing of rectangles) {
        // Check if rectangles overlap
        const overlaps = !(
          rectX + rectWidth < existing.x ||
          rectX > existing.x + existing.w ||
          rectY + rectHeight < existing.y ||
          rectY > existing.y + existing.h
        );

        if (overlaps) {
          // Calculate overlap area
          const overlapLeft = Math.max(rectX, existing.x);
          const overlapRight = Math.min(rectX + rectWidth, existing.x + existing.w);
          const overlapTop = Math.max(rectY, existing.y);
          const overlapBottom = Math.min(rectY + rectHeight, existing.y + existing.h);

          const overlapWidth = overlapRight - overlapLeft;
          const overlapHeight = overlapBottom - overlapTop;
          const overlapArea = overlapWidth * overlapHeight;

          const rectArea = rectWidth * rectHeight;
          const existingArea = existing.w * existing.h;

          const overlapPercentOfRect = overlapArea / rectArea;
          const overlapPercentOfExisting = overlapArea / existingArea;

          // If one rectangle is more than 80% inside the other, adjust position
          if (overlapPercentOfRect > 0.8 || overlapPercentOfExisting > 0.8) {
            // Shift rectangle to be more offset from existing
            const centerX = rectX + rectWidth / 2;
            const centerY = rectY + rectHeight / 2;
            const existingCenterX = existing.x + existing.w / 2;
            const existingCenterY = existing.y + existing.h / 2;

            // Push away significantly to reduce containment
            const dx = centerX - existingCenterX;
            const dy = centerY - existingCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              const pushDistance = Math.max(rectWidth, rectHeight) * 0.5;
              rectX += (dx / distance) * pushDistance;
              rectY += (dy / distance) * pushDistance;
            }
          }
          // If overlap is too small (less than 5% of either rectangle), adjust position to separate them
          else if (overlapPercentOfRect < 0.05 && overlapPercentOfExisting < 0.05) {
            // Move rectangle away to create separation
            const centerX = rectX + rectWidth / 2;
            const centerY = rectY + rectHeight / 2;
            const existingCenterX = existing.x + existing.w / 2;
            const existingCenterY = existing.y + existing.h / 2;

            // Push away from existing rectangle
            const dx = centerX - existingCenterX;
            const dy = centerY - existingCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              const pushDistance = Math.max(rectWidth, rectHeight) * 0.15;
              rectX += (dx / distance) * pushDistance;
              rectY += (dy / distance) * pushDistance;
            }
          }

          if (existing.color === rectColor) {
            // Color collision! Pick a different color
            hasColorCollision = true;
            break;
          }
        }
      }

      // If color collision, cycle to next color
      if (hasColorCollision) {
        if (rectColor === accent) {
          // Switch to first grayscale
          rectColor = primary[0];
        } else {
          // Find current color index and move to next
          const currentIndex = primary.indexOf(rectColor);
          rectColor = primary[(currentIndex + 1) % primary.length];
        }
      }

      rectangles.push({ x: rectX, y: rectY, w: rectWidth, h: rectHeight, color: rectColor });
    }

    // Draw all rectangles
    for (const rect of rectangles) {
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draw topographical opacity overlay with reduced effect
    const spacing = width / 10;
    drawTopographicalOverlay(ctx, width, height, background, seed, spacing, 0.5);

    ctx.restore();
  };

  // Generate a smooth 3D height map using Perlin-like noise
  // Returns z value in range [0.5, 1] for given x, y coordinates
  const getHeightMapValue = (
    x: number,
    y: number,
    seed: number,
    scale: number = 100 // How "zoomed in" the noise is (smaller = more variation)
  ): number => {
    // Create multiple octaves of noise for smooth variation
    const random = createSeededRandom(seed);

    // Simple pseudo-Perlin noise using sine waves at different frequencies
    const nx = x / scale;
    const ny = y / scale;

    // Layer multiple frequencies for more natural variation
    const noise1 = Math.sin(nx * 2 + random() * 100) * Math.cos(ny * 2 + random() * 100);
    const noise2 = Math.sin(nx * 4 + random() * 100) * Math.cos(ny * 4 + random() * 100) * 0.5;
    const noise3 = Math.sin(nx * 8 + random() * 100) * Math.cos(ny * 8 + random() * 100) * 0.25;

    // Combine octaves
    const combined = (noise1 + noise2 + noise3) / 1.75;

    // Map from [-1, 1] to [0.5, 1]
    return 0.75 + (combined * 0.25);
  };

  // Draw topographical opacity overlay using background color
  // Samples the height map at high rate and draws semi-transparent background color
  const drawTopographicalOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    backgroundColor: string,
    seed: number,
    spacing: number,
    alphaMultiplier: number = 1.0 // Multiplier for overlay opacity (default full effect)
  ) => {
    const sampleSize = spacing * CONFIG.topography.sampleRate;

    // Pre-calculate all height map values and cache them
    // This avoids recreating the random generator and recalculating sin/cos for each pixel
    const cols = Math.ceil(width / sampleSize);
    const rows = Math.ceil(height / sampleSize);
    const heightCache: number[][] = [];

    for (let row = 0; row < rows; row++) {
      heightCache[row] = [];
      for (let col = 0; col < cols; col++) {
        const x = col * sampleSize + sampleSize / 2;
        const y = row * sampleSize + sampleSize / 2;
        heightCache[row][col] = getHeightMapValue(x, y, seed, spacing * CONFIG.topography.scaleMultiplier);
      }
    }

    // Now draw using cached values
    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        // Calculate indices from position (more robust than manual incrementing)
        const row = Math.floor(y / sampleSize);
        const col = Math.floor(x / sampleSize);

        // Look up pre-calculated height value
        const heightValue = heightCache[row][col];

        // Invert: height 0.5 → overlay 0.5, height 1.0 → overlay 0
        // Apply alpha multiplier for reduced effect in some patterns
        const overlayAlpha = (1 - heightValue) * alphaMultiplier;

        // Draw semi-transparent background color rectangle
        ctx.fillStyle = backgroundColor;
        ctx.globalAlpha = overlayAlpha;

        const rectWidth = Math.min(sampleSize, width - x);
        const rectHeight = Math.min(sampleSize, height - y);
        ctx.fillRect(x, y, rectWidth, rectHeight);
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;
  };

  // Function to draw octagon pattern with topographical opacity overlay and texture
  const drawOctagons = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number, // Rotation angle of the pattern in degrees
    octagonColor: string,
    gridColor: string,
    backgroundColor: string,
    octagonSize: number = 8, // Size of each octagon in inches
    seed: number = 42 // Seed for reproducible randomness
  ) => {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Fill background color first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const octagonSizePx = octagonSize * SCALE;
    const spacing = octagonSizePx * 1.6;

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const numCols = Math.ceil(width / spacing) + 2;
    const numRows = Math.ceil(height / spacing) + 2;

    // Create seeded random for reproducible effects
    const random = createSeededRandom(seed);

    // LAYER 2: Draw connecting lines between octagons
    ctx.strokeStyle = octagonColor;
    ctx.lineWidth = octagonSizePx * 0.08;

    // Draw horizontal connecting lines (octagon to octagon to the right)
    for (let row = -1; row < numRows; row++) {
      for (let col = -1; col < numCols - 1; col++) {
        const centerX = col * spacing;
        const centerY = row * spacing;
        const nextCenterX = (col + 1) * spacing;

        const size = octagonSizePx / 2;
        const longSide = size * 0.25;

        // Line from right edge of current octagon to left edge of next octagon
        ctx.beginPath();
        ctx.moveTo(centerX + size, centerY);
        ctx.lineTo(nextCenterX - size, centerY);
        ctx.stroke();
      }
    }

    // Draw vertical connecting lines (octagon to octagon below)
    for (let row = -1; row < numRows - 1; row++) {
      for (let col = -1; col < numCols; col++) {
        const centerX = col * spacing;
        const centerY = row * spacing;
        const nextCenterY = (row + 1) * spacing;

        const size = octagonSizePx / 2;

        // Line from bottom edge of current octagon to top edge of next octagon
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + size);
        ctx.lineTo(centerX, nextCenterY - size);
        ctx.stroke();
      }
    }

    // LAYER 3: Draw octagons at full opacity
    ctx.strokeStyle = octagonColor;
    ctx.lineWidth = octagonSizePx * 0.08;

    // Draw octagons in a grid pattern
    for (let row = -1; row < numRows; row++) {
      for (let col = -1; col < numCols; col++) {
        const centerX = col * spacing;
        const centerY = row * spacing;

        // Draw octagon with horizontal/vertical sides longer than diagonal sides
        const size = octagonSizePx / 2;
        const longSide = size * 0.25;

        ctx.beginPath();
        // Start at top, go clockwise
        // Top edge
        ctx.moveTo(centerX - longSide, centerY - size);
        ctx.lineTo(centerX + longSide, centerY - size);
        // Top-right corner
        ctx.lineTo(centerX + size, centerY - longSide);
        // Right edge
        ctx.lineTo(centerX + size, centerY + longSide);
        // Bottom-right corner
        ctx.lineTo(centerX + longSide, centerY + size);
        // Bottom edge
        ctx.lineTo(centerX - longSide, centerY + size);
        // Bottom-left corner
        ctx.lineTo(centerX - size, centerY + longSide);
        // Left edge
        ctx.lineTo(centerX - size, centerY - longSide);
        // Top-left corner (back to start)
        ctx.closePath();
        ctx.stroke();
      }
    }

    // LAYER 4: Draw topographical opacity overlay
    drawTopographicalOverlay(ctx, width, height, backgroundColor, seed, spacing);

    // LAYER 5: Add texture overlay (grain/noise) on top of everything
    const grainDensity = 0.15; // Percentage of pixels to add grain to
    const grainSize = Math.max(1, SCALE * 0.3); // Size of grain particles
    const numGrainParticles = Math.floor((width * height * grainDensity) / (grainSize * grainSize));

    for (let i = 0; i < numGrainParticles; i++) {
      const grainX = random() * width;
      const grainY = random() * height;
      const grainAlpha = random() * 0.15; // Very subtle grain

      // Randomly darken or lighten
      const isDark = random() > 0.5;
      ctx.fillStyle = isDark ? `rgba(0, 0, 0, ${grainAlpha})` : `rgba(255, 255, 255, ${grainAlpha})`;

      ctx.fillRect(grainX, grainY, grainSize, grainSize);
    }

    ctx.restore();
  };

  // Helper function to draw a single pattern ribbon
  const drawSingleRibbon = (
    ctx: CanvasRenderingContext2D,
    angleDeg: number,
    ribbonWidth: number,
    centerX: number,
    centerY: number,
    ribbonSpacing: number,
    position: 'center' | 'above' | 'below',
    segmentArray: ReadonlyArray<{
      pattern: 'rings' | 'greekKey' | 'octagons' | 'rectangles';
      length: number;
      seed: number;
      colors: {
        background: string;
        primary: string | readonly string[];
        accent: string;
      };
    }>,
    shift: number // Shift along ribbon direction in feet (positive = forward along angle direction)
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const perpAngleRad = angleRad + Math.PI / 2;

    // Calculate total ribbon length from segment array (convert feet to pixels)
    const ribbonTotalLength = segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);
    const halfLength = ribbonTotalLength / 2;

    // Calculate where the centerline should start
    const centerlineStartX = centerX - Math.cos(angleRad) * halfLength;
    const centerlineStartY = centerY - Math.sin(angleRad) * halfLength;

    // The drawing functions add (segmentLength/2, ribbonWidth/2) in world coordinates before rotating
    // We need to compensate for this to get the centerline positioned correctly
    // Use the first segment's length for the initial offset calculation
    const firstSegmentLengthPx = segmentArray[0].length * 12 * SCALE;
    const baseRibbonStartX = centerlineStartX + 0.5 * firstSegmentLengthPx * Math.cos(angleRad) - firstSegmentLengthPx / 2;
    const baseRibbonStartY = centerlineStartY + 0.5 * firstSegmentLengthPx * Math.sin(angleRad) - ribbonWidth / 2;

    // Calculate position offset based on ribbon position
    let positionOffsetX = 0;
    let positionOffsetY = 0;

    if (position === 'above') {
      positionOffsetX = Math.cos(perpAngleRad) * ribbonSpacing;
      positionOffsetY = Math.sin(perpAngleRad) * ribbonSpacing;
    } else if (position === 'below') {
      positionOffsetX = -Math.cos(perpAngleRad) * ribbonSpacing;
      positionOffsetY = -Math.sin(perpAngleRad) * ribbonSpacing;
    }

    // Apply directional shift (convert feet to pixels)
    const shiftPx = shift * 12 * SCALE;
    const shiftOffsetX = Math.cos(angleRad) * shiftPx;
    const shiftOffsetY = Math.sin(angleRad) * shiftPx;

    const ribbonStartX = baseRibbonStartX + positionOffsetX + shiftOffsetX;
    const ribbonStartY = baseRibbonStartY + positionOffsetY + shiftOffsetY;

    // Draw pattern segments along this ribbon
    let cumulativeDistance = 0;
    for (let i = 0; i < segmentArray.length; i++) {
      const segment = segmentArray[i];
      const segmentLengthPx = segment.length * 12 * SCALE; // Convert feet to pixels

      // Calculate segment position (drawing functions handle their own centering)
      const segmentX = ribbonStartX + Math.cos(angleRad) * cumulativeDistance;
      const segmentY = ribbonStartY + Math.sin(angleRad) * cumulativeDistance;

      // Extract colors from segment (handle both string and array for primary)
      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // ringColor
            accent, // borderColor
            background, // backgroundColor
            CONFIG.patterns.rings.ringRadius,
            segment.seed
          );
          break;
        case 'greekKey':
          drawGreekKey(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // patternColor
            background, // backgroundColor
            CONFIG.patterns.greekKey.keySize,
            segment.seed
          );
          break;
        case 'rectangles':
          drawRandomRectangles(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            Array.isArray(primary) ? primary : [primary], // primary colors array
            accent, // accent color
            background, // background
            segment.seed
          );
          break;
        case 'octagons':
          drawOctagons(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // octagonColor
            accent, // gridColor
            background, // backgroundColor
            CONFIG.patterns.octagons.octagonSize,
            segment.seed
          );
          break;
      }

      // Accumulate distance for next segment
      cumulativeDistance += segmentLengthPx;
    }
  };

  // Function to draw woven thread texture
  const drawWeave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const random = createSeededRandom(CONFIG.weave.seed);

    const warpAngleRad = (CONFIG.weave.warpThreads.angle * Math.PI) / 180;
    const weftAngleRad = (CONFIG.weave.weftThreads.angle * Math.PI) / 180;

    // Generate warp thread positions
    // Use seeded random to position thread centers across the entire canvas
    const warpThreads: Array<{ x: number; y: number; length: number; index: number }> = [];

    for (let i = 0; i < CONFIG.weave.warpThreads.count; i++) {
      // Random position across entire canvas (with margin for threads extending beyond)
      const x = random() * width * 1.2 - width * 0.1; // 120% width centered
      const y = random() * height * 1.2 - height * 0.1; // 120% height centered

      // Random length for threadbare effect
      const lengthInches = CONFIG.weave.warpThreads.minLength +
        random() * (CONFIG.weave.warpThreads.maxLength - CONFIG.weave.warpThreads.minLength);
      const length = lengthInches * SCALE;

      warpThreads.push({ x, y, length, index: i });
    }

    // Generate weft thread positions
    // Use seeded random to position thread centers across the entire canvas
    const weftThreads: Array<{ x: number; y: number; length: number; index: number }> = [];

    for (let i = 0; i < CONFIG.weave.weftThreads.count; i++) {
      // Random position across entire canvas (with margin for threads extending beyond)
      const x = random() * width * 1.2 - width * 0.1; // 120% width centered
      const y = random() * height * 1.2 - height * 0.1; // 120% height centered

      const lengthInches = CONFIG.weave.weftThreads.minLength +
        random() * (CONFIG.weave.weftThreads.maxLength - CONFIG.weave.weftThreads.minLength);
      const length = lengthInches * SCALE;

      weftThreads.push({ x, y, length, index: i });
    }
    ctx.fillStyle = CONFIG.colors.threads;
    ctx.globalAlpha = CONFIG.weave.opacity;

    // Draw warp threads
    for (const warp of warpThreads) {
      const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.variation.thicknessVariation;
      const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

      drawThread(ctx, warp.x, warp.y, warp.length, warpAngleRad, threadWidth);
    }

    // Draw weft threads
    for (const weft of weftThreads) {
      const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.variation.thicknessVariation;
      const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

      drawThread(ctx, weft.x, weft.y, weft.length, weftAngleRad, threadWidth);
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not found');
      return;
    }

    // Set canvas size based on tarp dimensions
    const width = TARP_WIDTH_INCHES * SCALE;   // 1,080 * SCALE pixels
    const height = TARP_HEIGHT_INCHES * SCALE; // 720 * SCALE pixels
    canvas.width = width;
    canvas.height = height;

    // Fill canvas with dark grey background
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Draw woven thread texture on top
    drawWeave(ctx, width, height);

    // Setup ribbon parameters from config
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE; // Convert feet to inches, then to pixels
    const ribbonSpacing = ribbonWidth * CONFIG.ribbons.spacingMultiplier;
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw pattern ribbons layer by layer (bottom to top)
    for (const layer of CONFIG.ribbons.layers) {
      const angle = layer.direction === 'warp'
        ? CONFIG.weave.warpThreads.angle
        : CONFIG.weave.weftThreads.angle;

      drawSingleRibbon(
        ctx,
        angle,
        ribbonWidth,
        centerX,
        centerY,
        ribbonSpacing,
        layer.position,
        layer.segmentArray,
        layer.shift
      );
    }

    // Cleanup function to clear canvas on unmount
    return () => {
      ctx.clearRect(0, 0, width, height);
    };
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
    root.render(<TarpCC22026 />);
  }
});

export default TarpCC22026;
