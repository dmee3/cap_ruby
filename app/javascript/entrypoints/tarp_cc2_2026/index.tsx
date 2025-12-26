import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Tarp dimensions in feet
const TARP_WIDTH_FEET = 90;
const TARP_HEIGHT_FEET = 60;

// Convert to inches (base unit: 1 pixel = 1 inch at SCALE = 1)
const TARP_WIDTH_INCHES = TARP_WIDTH_FEET * 12;  // 1,080 inches
const TARP_HEIGHT_INCHES = TARP_HEIGHT_FEET * 12; // 720 inches

// Scale factor: pixels per inch
// SCALE = 1: 1,080 × 720 px (1 pixel per inch, print-ready)
// SCALE = 10: 10,800 × 7,200 px (10 pixels per inch, high-res)
const SCALE = 10;

// Configuration constants
const CONFIG = {
  colors: {
    background: '#3a3a3a', // Dark grey background
    threads: '#000000', // Black threads
  },
  weave: {
    warpThreads: {
      count: 1200, // Number of warp threads (one direction)
      angle: 30, // Angle in degrees
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches (some span most of canvas)
    },
    weftThreads: {
      count: 1200, // Number of weft threads (other direction)
      angle: 150, // Complementary angle in degrees
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches
    },
    baseWidth: 2, // Base width in inches at center of thread
    opacity: 0.6, // Base opacity for threads
    pattern: 'plain', // Plain weave: simple over-under pattern
    seed: 42069, // Seed for reproducible randomness
    variation: {
      positionOffset: 0.15, // Position offset from grid (0-1, as fraction of spacing)
      thicknessVariation: 0.2, // Thickness variation (0.8-1.2x)
      curveAmount: 0.3, // How much threads curve at intersections (in thread widths)
    },
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

    // Draw topographical opacity overlay using background color
    // Sample the height map at a high rate and draw semi-transparent background color
    // Using inverse of height map: [0.5, 1] becomes [0, 0.5] for overlay opacity
    const sampleSize = spacing * 0.0625; // Very high sample rate (1/16th of a ring spacing)

    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        // Sample height at center of this region
        const heightValue = getHeightMapValue(x + sampleSize / 2, y + sampleSize / 2, seed, spacing * 1.5);

        // Invert: height 0.5 → overlay 0.5, height 1.0 → overlay 0
        const overlayAlpha = 1 - heightValue;

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

    ctx.restore();
  };

  // Function to draw Greek key pattern
  const drawGreekKey = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    angle: number, // Rotation angle of the pattern in degrees
    color1: string,
    backgroundColor: string,
    keySize: number = 8, // Size of each key unit in inches
    seed: number = 42 // Seed for reproducible randomness
  ) => {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    // Fill background color first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();

    const patternSize = keySize * SCALE;

    ctx.lineWidth = SCALE * 1.6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = color1;

    let rowIndex = 0;
    let baseY = 0;
    while (baseY < size) {
      // Offset every other row by half a pattern width
      const xOffset = (rowIndex % 2 === 1) ? patternSize / 2 : 0;
      let baseX = xOffset - patternSize; // Start one pattern to the left

      while (baseX < size + patternSize) { // Draw a bit beyond edge to handle offset
        drawGreekKeyUnit(ctx, baseX, baseY, patternSize);
        baseX += patternSize;
      }

      baseY += patternSize * 7 / 8;
      rowIndex++;
    }

    // Draw topographical opacity overlay using background color
    // Sample the height map at a high rate and draw semi-transparent background color
    // Using inverse of height map: [0.5, 1] becomes [0, 0.5] for overlay opacity
    const spacing = patternSize; // Use pattern size as spacing reference
    const sampleSize = spacing * 0.0625; // Very high sample rate (1/16th of a pattern spacing)

    for (let y = 0; y < size; y += sampleSize) {
      for (let x = 0; x < size; x += sampleSize) {
        // Sample height at center of this region
        const heightValue = getHeightMapValue(x + sampleSize / 2, y + sampleSize / 2, seed, spacing * 1.5);

        // Invert: height 0.5 → overlay 0.5, height 1.0 → overlay 0
        const overlayAlpha = 1 - heightValue;

        // Draw semi-transparent background color rectangle
        ctx.fillStyle = backgroundColor;
        ctx.globalAlpha = overlayAlpha;

        const rectWidth = Math.min(sampleSize, size - x);
        const rectHeight = Math.min(sampleSize, size - y);
        ctx.fillRect(x, y, rectWidth, rectHeight);
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;

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
    colors: string[], // Array of colors to use
    accentColor: string, // Accent color to add variety
    backgroundColor: string,
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
        rectColor = accentColor;
      } else {
        const colorIndex = Math.floor(random() * colors.length);
        rectColor = colors[colorIndex];
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
        if (rectColor === accentColor) {
          // Switch to first grayscale
          rectColor = colors[0];
        } else {
          // Find current color index and move to next
          const currentIndex = colors.indexOf(rectColor);
          rectColor = colors[(currentIndex + 1) % colors.length];
        }
      }

      rectangles.push({ x: rectX, y: rectY, w: rectWidth, h: rectHeight, color: rectColor });
    }

    // Draw all rectangles
    for (const rect of rectangles) {
      ctx.fillStyle = rect.color;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Draw topographical opacity overlay using background color
    // Sample the height map at a high rate and draw semi-transparent background color
    // Using inverse of height map with reduced effect: [0.5, 1] becomes [0, 0.25] for overlay opacity
    const spacing = width / 10; // Use a reasonable spacing based on swatch size
    const sampleSize = spacing * 0.0625; // Very high sample rate (1/16th of spacing)

    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        // Sample height at center of this region
        const heightValue = getHeightMapValue(x + sampleSize / 2, y + sampleSize / 2, seed, spacing * 1.5);

        // Invert and scale: height 0.5 → overlay 0.25, height 1.0 → overlay 0
        const overlayAlpha = (1 - heightValue) * 0.5;

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

    // LAYER 1: Draw grid underlay (drawn first, stays underneath)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = octagonSizePx * 0.04;

    // Draw vertical grid lines
    for (let col = 0; col < numCols; col++) {
      const gridX = col * spacing - spacing / 2;
      ctx.beginPath();
      ctx.moveTo(gridX, -spacing);
      ctx.lineTo(gridX, height + spacing);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let row = 0; row < numRows; row++) {
      const gridY = row * spacing - spacing / 2;
      ctx.beginPath();
      ctx.moveTo(-spacing, gridY);
      ctx.lineTo(width + spacing, gridY);
      ctx.stroke();
    }

    // LAYER 2: Draw octagons at full opacity
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

        // Draw connecting lines to neighbors
        // (only draw to right and bottom to avoid duplicates)

        // Connect to south neighbor (two vertical lines from bottom edge)
        ctx.beginPath();
        ctx.moveTo(centerX - longSide, centerY + size);
        ctx.lineTo(centerX - longSide, centerY + size + (spacing - octagonSizePx));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + longSide, centerY + size);
        ctx.lineTo(centerX + longSide, centerY + size + (spacing - octagonSizePx));
        ctx.stroke();

        // Connect to east neighbor (two horizontal lines from right edge)
        ctx.beginPath();
        ctx.moveTo(centerX + size, centerY - longSide);
        ctx.lineTo(centerX + size + (spacing - octagonSizePx), centerY - longSide);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + size, centerY + longSide);
        ctx.lineTo(centerX + size + (spacing - octagonSizePx), centerY + longSide);
        ctx.stroke();
      }
    }

    // LAYER 2.5: Draw topographical opacity overlay using background color
    // Sample the height map at a high rate and draw semi-transparent background color
    // Using inverse of height map: [0.5, 1] becomes [0, 0.5] for overlay opacity
    const sampleSize = spacing * 0.0625; // Very high sample rate (1/16th of an octagon spacing)

    for (let y = 0; y < height; y += sampleSize) {
      for (let x = 0; x < width; x += sampleSize) {
        // Sample height at center of this region
        const heightValue = getHeightMapValue(x + sampleSize / 2, y + sampleSize / 2, seed, spacing * 1.5);

        // Invert: height 0.5 → overlay 0.5, height 1.0 → overlay 0
        const overlayAlpha = 1 - heightValue;

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

    // LAYER 3: Add texture overlay (grain/noise) on top of everything
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

  // Function to draw woven thread texture
  const drawWeave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    console.log('Drawing woven texture...', CONFIG.weave);
    console.log('Canvas dimensions:', width, height);
    const random = createSeededRandom(CONFIG.weave.seed);

    const warpAngleRad = (CONFIG.weave.warpThreads.angle * Math.PI) / 180;
    const weftAngleRad = (CONFIG.weave.weftThreads.angle * Math.PI) / 180;
    console.log('Warp angle (rad):', warpAngleRad, 'Weft angle (rad):', weftAngleRad);

    // Calculate grid spacing for deterministic positioning
    // Base spacing on physical dimensions (inches) so it scales with SCALE constant

    // Calculate tarp diagonal in inches
    const tarpWidthInches = TARP_WIDTH_INCHES;
    const tarpHeightInches = TARP_HEIGHT_INCHES;
    const tarpDiagonalInches = Math.sqrt(tarpWidthInches * tarpWidthInches + tarpHeightInches * tarpHeightInches);

    // Space threads evenly across the diagonal (in inches), then convert to pixels
    // Use 1.5x diagonal for extra coverage beyond edges
    const warpSpacingInches = (tarpDiagonalInches * 1.5) / CONFIG.weave.warpThreads.count;
    const weftSpacingInches = (tarpDiagonalInches * 1.5) / CONFIG.weave.weftThreads.count;

    const warpSpacing = warpSpacingInches * SCALE;
    const weftSpacing = weftSpacingInches * SCALE;

    // Generate warp thread positions (angle: 30°)
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
    console.log('First 5 warp threads:', warpThreads.slice(0, 5));

    // Generate weft thread positions (angle: 150°)
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
    console.log('First 5 weft threads:', weftThreads.slice(0, 5));
    console.log('Warp spacing:', warpSpacing, 'Weft spacing:', weftSpacing);

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
    console.log('TarpCC22026 useEffect running...');
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
    console.log('Canvas dimensions:', width, height);

    // Fill canvas with dark grey background
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, width, height);
    console.log('Background drawn');

    // Draw woven thread texture on top
    drawWeave(ctx, width, height);

    // Draw sample swatches of decorative patterns for review
    const swatchWidth = 200 * SCALE; // 200 inches wide
    const swatchHeight = 150 * SCALE; // 150 inches tall
    const swatchSpacing = 50 * SCALE; // 50 inches between swatches
    const swatchY = 100 * SCALE; // 100 inches from top

    // Setup text styling
    ctx.fillStyle = '#ffffff';
    ctx.font = `${20 * SCALE}px sans-serif`;
    ctx.textAlign = 'center';

    // First row of swatches - Decorative/Rug patterns
    // Swatch 1: Interlocking Rings
    const swatch1X = 100 * SCALE;
    drawInterlockingRings(
      ctx,
      swatch1X,
      swatchY,
      swatchWidth,
      swatchHeight,
      0, // No rotation
      '#386374', // Ring color
      '#ffffff', // Border color (white)
      '#e8dcc8', // Warm beige background
      24, // Ring radius in inches
      456 // Seed for reproducible topographical overlay
    );

    // Swatch 2: Greek Key
    const swatch2X = swatch1X + swatchWidth + swatchSpacing;
    drawGreekKey(
      ctx,
      swatch2X,
      swatchY,
      swatchWidth,
      0, // No rotation
      '#5a5a5a', // Grey pattern
      '#e8dcc8', // Warm beige background
      32, // Key size in inches (16 * 1.5 = 24)
      234 // Seed for reproducible topographical overlay
    );

    // Swatch 3: Random Rectangles
    const swatch3X = swatch2X + swatchWidth + swatchSpacing;
    drawRandomRectangles(
      ctx,
      swatch3X,
      swatchY,
      swatchWidth,
      swatchHeight,
      0, // No rotation
      ['#8a8a8a', '#6a6a6a', '#4a4a4a'], // Greyscale colors (removed darkest)
      '#386374', // Accent color (teal)
      '#e8dcc8', // Warm beige background
      5 // Seed for consistent pattern
    );

    // Draw labels for first row of swatches
    ctx.fillText('Interlocking Rings', swatch1X + swatchWidth / 2, swatchY - 20 * SCALE);
    ctx.fillText('Greek Key', swatch2X + swatchWidth / 2, swatchY - 20 * SCALE);
    ctx.fillText('Random Rectangles', swatch3X + swatchWidth / 2, swatchY - 20 * SCALE);

    // Second row - just floral pattern (centered)
    const swatch2RowY = swatchY + swatchHeight + swatchSpacing + 50 * SCALE;
    const swatch4X = 100 * SCALE + swatchWidth + swatchSpacing; // Center it

    // Swatch 4: Octagons
    drawOctagons(
      ctx,
      swatch4X,
      swatch2RowY,
      swatchWidth,
      swatchHeight,
      0, // No rotation
      '#e8dcc8', // Warm beige octagons
      '#5a5a5a', // Grey grid overlay
      '#386374', // Teal background
      16, // Octagon size in inches
      789 // Seed for reproducible weathering
    );

    // Draw label for octagon pattern
    ctx.fillText('Octagons', swatch4X + swatchWidth / 2, swatch2RowY - 20 * SCALE);

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
