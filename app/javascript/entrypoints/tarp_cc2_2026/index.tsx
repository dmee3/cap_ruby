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
    scratches: '#000000', // Black scratch marks
  },
  scratches: {
    count: 800, // Number of scratch marks to draw
    minLength: 12, // Minimum length in inches
    maxLength: 120, // Maximum length in inches
    baseWidth: 2, // Base width in inches at center of scratch (20 pixels at SCALE=10)
    angleDegrees: 30, // Angle above horizontal
    opacity: 0.6, // Opacity of scratch marks
  },
} as const;

const TarpCC22026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw a single scratch mark with tapered ends
  const drawScratch = (
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

    // Draw the scratch as a tapered line using a path
    // We'll create a shape that's wider in the middle and tapers to points at the ends
    const numSegments = 20;
    ctx.beginPath();

    // Draw upper edge of the scratch
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const currentX = startX + (endX - startX) * t;
      const currentY = startY + (endY - startY) * t;

      // Taper: width is 0 at ends (t=0, t=1) and maxWidth at center (t=0.5)
      // Using a sine wave for smooth tapering
      const widthMultiplier = Math.sin(t * Math.PI);
      const currentWidth = baseWidth * widthMultiplier / 2;

      // Offset perpendicular to the scratch direction
      const offsetX = currentX - Math.sin(angle) * currentWidth;
      const offsetY = currentY + Math.cos(angle) * currentWidth;

      if (i === 0) {
        ctx.moveTo(offsetX, offsetY);
      } else {
        ctx.lineTo(offsetX, offsetY);
      }
    }

    // Draw lower edge of the scratch (in reverse)
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
    backgroundColor: string,
    ringRadius: number = 6 // Radius of each ring in inches
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

    ctx.lineWidth = SCALE * 1.6;

    // Draw rings in a grid pattern
    for (let row = -1; row < numRows; row++) {
      for (let col = -1; col < numCols; col++) {
        const centerX = col * spacing;
        const centerY = row * spacing;

        ctx.strokeStyle = ringColor;

        // Draw ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadiusPx, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

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
    keySize: number = 8 // Size of each key unit in inches
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

    let baseX = 0;
    let baseY = 0;
    while (baseX < size && baseY < size) {
      drawGreekKeyUnit(ctx, baseX, baseY, patternSize);
      baseX += patternSize;
      if (baseX >= size) {
        baseX = 0;
        baseY += patternSize * 7 / 8;
      }
    }

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

    // Simple seeded random function
    let seedValue = seed;
    const seededRandom = () => {
      seedValue = (seedValue * Math.random() * 10000) % 233280;
      return seedValue / 233280;
    };

    // Generate random rectangles
    const numRectangles = 10;

    for (let i = 0; i < numRectangles; i++) {
      const rectX = seededRandom() * width * 0.9;
      const rectY = seededRandom() * height * 0.9;
      const rectWidth = (seededRandom() * 0.3 + 0.1) * width;
      const rectHeight = (seededRandom() * 0.3 + 0.1) * height;

      // Pick a random color
      const colorIndex = Math.floor(seededRandom() * colors.length);
      ctx.fillStyle = colors[colorIndex];

      // Draw rectangle
      ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }

    ctx.restore();
  };

  // Function to draw floral pattern
  const drawFloral = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number, // Rotation angle of the pattern in degrees
    petalColor: string,
    centerColor: string,
    backgroundColor: string,
    flowerSize: number = 8 // Size of each flower in inches
  ) => {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-width / 2, -height / 2);

    // Fill background color first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const flowerSizePx = flowerSize * SCALE;
    const spacing = flowerSizePx * 1.5;

    // Create a clipping region for the area
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    const numCols = Math.ceil(width / spacing) + 2;
    const numRows = Math.ceil(height / spacing) + 2;

    // Draw flowers in a grid pattern
    for (let row = -1; row < numRows; row++) {
      for (let col = -1; col < numCols; col++) {
        const offsetX = (row % 2) * (spacing / 2);
        const centerX = col * spacing + offsetX;
        const centerY = row * spacing;

        // Draw a simple 5-petal flower with random size variation
        const sizeVariation = 0.7 + Math.random() * 0.6; // Random size between 0.7 and 1.3
        const petalRadius = (flowerSizePx / 3) * sizeVariation;
        const petalDistance = (flowerSizePx / 2.5) * sizeVariation; // Distance from center to petal center
        const numPetals = 5;

        ctx.fillStyle = petalColor;

        // Draw petals
        for (let p = 0; p < numPetals; p++) {
          const petalAngle = (p / numPetals) * Math.PI * 2;
          const petalX = centerX + Math.cos(petalAngle) * petalDistance;
          const petalY = centerY + Math.sin(petalAngle) * petalDistance;

          // Draw petal as an ellipse (rotated to point outward from center)
          ctx.beginPath();
          ctx.ellipse(
            petalX,
            petalY,
            petalRadius * 0.5,
            petalRadius * 1.5,
            petalAngle + Math.PI / 2, // Rotate 90 degrees to point outward
            0,
            2 * Math.PI
          );
          ctx.fill();
        }

        // Draw flower center
        ctx.fillStyle = centerColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, petalRadius * 0.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Function to draw all scratch marks
  const drawScratches = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    console.log('Drawing scratches...', CONFIG.scratches);
    const angleRadians = (CONFIG.scratches.angleDegrees * Math.PI) / 180;

    ctx.fillStyle = CONFIG.colors.scratches;
    ctx.globalAlpha = CONFIG.scratches.opacity;

    // Draw scratches in both directions
    for (let i = 0; i < CONFIG.scratches.count; i++) {
      // Random position across the canvas
      const x = Math.random() * width;
      const y = Math.random() * height;

      // Random length
      const lengthInches = CONFIG.scratches.minLength +
        Math.random() * (CONFIG.scratches.maxLength - CONFIG.scratches.minLength);
      const length = lengthInches * SCALE;

      // Random width variation
      const widthVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      const baseWidth = CONFIG.scratches.baseWidth * SCALE * widthVariation;

      // Alternate between the two directions
      // Direction 1: 30° above horizontal, right-to-left (angle = 150°)
      // Direction 2: 30° above horizontal, left-to-right (angle = 30°)
      const angle = i % 2 === 0
        ? Math.PI - angleRadians  // 150° for right-to-left
        : angleRadians;            // 30° for left-to-right

      drawScratch(ctx, x, y, length, angle, baseWidth);
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

    // Draw scratch marks on top
    drawScratches(ctx, width, height);

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
      '#386374',
      '#e8dcc8', // Warm beige background
      24 // Ring radius in inches
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
      24 // Key size in inches (8 * 3 for scaling)
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
      ['#8a8a8a', '#6a6a6a', '#4a4a4a', '#2a2a2a'], // Greyscale colors
      '#e8dcc8', // Warm beige background
      123 // Seed for consistent pattern
    );

    // Draw labels for first row of swatches
    ctx.fillText('Interlocking Rings', swatch1X + swatchWidth / 2, swatchY - 20 * SCALE);
    ctx.fillText('Greek Key', swatch2X + swatchWidth / 2, swatchY - 20 * SCALE);
    ctx.fillText('Random Rectangles', swatch3X + swatchWidth / 2, swatchY - 20 * SCALE);

    // Second row - just floral pattern (centered)
    const swatch2RowY = swatchY + swatchHeight + swatchSpacing + 50 * SCALE;
    const swatch4X = 100 * SCALE + swatchWidth + swatchSpacing; // Center it

    // Swatch 4: Floral
    drawFloral(
      ctx,
      swatch4X,
      swatch2RowY,
      swatchWidth,
      swatchHeight,
      0, // No rotation
      '#7a7a7a', // Grey petals
      '#4a4a4a', // Dark grey centers
      '#e8dcc8', // Warm beige background
      24 // Flower size in inches (8 * 3 for scaling)
    );

    // Draw label for floral pattern
    ctx.fillText('Floral', swatch4X + swatchWidth / 2, swatch2RowY - 20 * SCALE);

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
