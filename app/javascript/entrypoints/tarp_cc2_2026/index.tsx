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
      angle: 33.69, // Angle in degrees (lower-left to upper-right diagonal)
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches (some span most of canvas)
    },
    weftThreads: {
      count: 1200, // Number of weft threads (other direction)
      angle: 146.31, // Complementary angle in degrees (180 - 33.69)
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

    // Draw topographical opacity overlay with reduced effect
    const spacing = width / 10;
    drawTopographicalOverlay(ctx, width, height, backgroundColor, seed, spacing, 0.5);

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
    const sampleSize = spacing * 0.0625; // Very high sample rate (1/16th of spacing)

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
        heightCache[row][col] = getHeightMapValue(x, y, seed, spacing * 1.5);
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

    // LAYER 2.5: Draw topographical opacity overlay
    drawTopographicalOverlay(ctx, width, height, backgroundColor, seed, spacing);

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

  // Helper function to draw pattern ribbons at a given angle
  const drawPatternRibbons = (
    ctx: CanvasRenderingContext2D,
    angleDeg: number,
    ribbonWidth: number,
    segmentLength: number,
    ribbonTotalLength: number,
    centerX: number,
    centerY: number,
    ribbonSpacing: number
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const halfLength = ribbonTotalLength / 2;
    const perpAngleRad = angleRad + Math.PI / 2;

    // Calculate where the centerline should start
    const centerlineStartX = centerX - Math.cos(angleRad) * halfLength;
    const centerlineStartY = centerY - Math.sin(angleRad) * halfLength;

    // The drawing functions add (segmentLength/2, ribbonWidth/2) in world coordinates before rotating
    // We need to compensate for this to get the centerline positioned correctly
    //
    // For segment i, the center will be at:
    //   (startX + i*segLen*cos + segLen/2, startY + i*segLen*sin + ribWidth/2)
    // We want this to equal:
    //   (centerlineStartX + (i+0.5)*segLen*cos, centerlineStartY + (i+0.5)*segLen*sin)
    //
    // Solving for startX and startY:
    const centerRibbonStartX = centerlineStartX + 0.5 * segmentLength * Math.cos(angleRad) - segmentLength / 2;
    const centerRibbonStartY = centerlineStartY + 0.5 * segmentLength * Math.sin(angleRad) - ribbonWidth / 2;

    // Create array of ribbon starting positions with pattern offsets
    const ribbonOffsets = [
      { startX: centerRibbonStartX, startY: centerRibbonStartY, patternOffset: 0 },
      {
        startX: centerRibbonStartX + Math.cos(perpAngleRad) * ribbonSpacing,
        startY: centerRibbonStartY + Math.sin(perpAngleRad) * ribbonSpacing,
        patternOffset: 1
      },
      {
        startX: centerRibbonStartX - Math.cos(perpAngleRad) * ribbonSpacing,
        startY: centerRibbonStartY - Math.sin(perpAngleRad) * ribbonSpacing,
        patternOffset: 0
      }
    ];

    const patterns = ['rings', 'greekKey', 'octagons', 'rectangles'];
    const numSegments = Math.ceil(ribbonTotalLength / segmentLength);

    for (const ribbonOffset of ribbonOffsets) {
      for (let i = 0; i < numSegments; i++) {
        const patternIndex = (i + ribbonOffset.patternOffset) % patterns.length;
        const pattern = patterns[patternIndex];

        const segmentDistance = i * segmentLength;
        const segmentX = ribbonOffset.startX + Math.cos(angleRad) * segmentDistance;
        const segmentY = ribbonOffset.startY + Math.sin(angleRad) * segmentDistance;

        switch (pattern) {
          case 'rings':
            drawInterlockingRings(
              ctx, segmentX, segmentY, segmentLength, ribbonWidth, angleDeg,
              '#386374', '#a0a0a0', '#d5d5ee', 24, 456 + i
            );
            break;
          case 'greekKey':
            drawGreekKey(
              ctx, segmentX, segmentY, segmentLength, ribbonWidth, angleDeg,
              '#5a5a5a', '#e8dcc8', 32, 234 + i
            );
            break;
          case 'rectangles':
            drawRandomRectangles(
              ctx, segmentX, segmentY, segmentLength, ribbonWidth, angleDeg,
              ['#8a8a8a', '#6a6a6a', '#4a4a4a'], '#386374', '#a8c0d0', 5 + i
            );
            break;
          case 'octagons':
            drawOctagons(
              ctx, segmentX, segmentY, segmentLength, ribbonWidth, angleDeg,
              '#b8a070', '#5a5a5a', '#386374', 16, 789 + i
            );
            break;
        }
      }
    }
  };

  // Function to draw woven thread texture
  const drawWeave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const random = createSeededRandom(CONFIG.weave.seed);

    const warpAngleRad = (CONFIG.weave.warpThreads.angle * Math.PI) / 180;
    const weftAngleRad = (CONFIG.weave.weftThreads.angle * Math.PI) / 180;

    // Calculate grid spacing for deterministic positioning
    // Base spacing on physical dimensions (inches) so it scales with SCALE constant

    // Calculate tarp diagonal in inches
    const tarpDiagonalInches = Math.sqrt(TARP_WIDTH_INCHES * TARP_WIDTH_INCHES + TARP_HEIGHT_INCHES * TARP_HEIGHT_INCHES);

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

    // Setup ribbon parameters
    const ribbonWidth = 6 * 12 * SCALE; // 6 feet = 72 inches (perpendicular to ribbon)
    const segmentLength = 12 * 12 * SCALE; // 12 feet = 144 inches (along ribbon direction)
    const tarpDiagonal = Math.sqrt(width * width + height * height);
    const ribbonTotalLength = tarpDiagonal * 1.5; // Extra length to ensure full coverage
    const ribbonSpacing = ribbonWidth * 3; // Space ribbons apart (3x ribbon width)
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw pattern ribbons at warp angle (33.69° - lower-left to upper-right)
    drawPatternRibbons(
      ctx,
      CONFIG.weave.warpThreads.angle,
      ribbonWidth,
      segmentLength,
      ribbonTotalLength,
      centerX,
      centerY,
      ribbonSpacing
    );

    // Draw pattern ribbons at weft angle (146.31° - upper-left to lower-right)
    drawPatternRibbons(
      ctx,
      CONFIG.weave.weftThreads.angle,
      ribbonWidth,
      segmentLength,
      ribbonTotalLength,
      centerX,
      centerY,
      ribbonSpacing
    );

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
