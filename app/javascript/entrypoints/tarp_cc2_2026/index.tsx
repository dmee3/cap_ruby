import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Import configuration and utilities
import { TARP_WIDTH_INCHES, TARP_HEIGHT_INCHES, SCALE, CONFIG } from './config';

// Import pattern renderers
import { drawInterlockingRings } from './patterns/rings';
import { drawGreekKey } from './patterns/greekKey';
import { drawOctagons } from './patterns/octagons';
import { drawArtDecoPattern } from './patterns/artDeco';
import { drawWeave } from './patterns/weave';
import { drawCurvedTowers } from './patterns/curvedTowers';

// Import pattern helpers
import { drawGoldBorderLines } from './patternHelpers';
import { createSeededRandom } from './utils';

const TarpCC22026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper function to draw a single thread with tapered ends
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

      // Taper: width is 0 at ends and maxWidth at center
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

  // Helper function to draw guide threads for a ribbon
  const drawGuideThreads = (
    ctx: CanvasRenderingContext2D,
    angleDeg: number,
    ribbonWidth: number,
    centerX: number,
    centerY: number,
    ribbonSpacing: number,
    position: 'center' | 'above' | 'below',
    shift: number, // Shift along ribbon direction in feet
    layerIndex: number, // For unique seeding per ribbon
    segmentArray: ReadonlyArray<{ length: number }> // To calculate total ribbon length
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const perpAngleRad = angleRad + Math.PI / 2;

    // Calculate total ribbon length from segment array
    const ribbonTotalLength = segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);
    const halfLength = ribbonTotalLength / 2;

    // Calculate ribbon start position (where the centerline starts)
    const centerlineStartX = centerX - Math.cos(angleRad) * halfLength;
    const centerlineStartY = centerY - Math.sin(angleRad) * halfLength;

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

    // Apply directional shift
    const shiftPx = shift * 12 * SCALE;
    const shiftOffsetX = Math.cos(angleRad) * shiftPx;
    const shiftOffsetY = Math.sin(angleRad) * shiftPx;

    const ribbonStartX = centerlineStartX + positionOffsetX + shiftOffsetX;
    const ribbonStartY = centerlineStartY + positionOffsetY + shiftOffsetY;

    // Create seeded random for this ribbon (unique per layer)
    const random = createSeededRandom(CONFIG.weave.seed + layerIndex * 1000);

    // Generate guide threads distributed along the ribbon path
    const numThreads = CONFIG.ribbons.guideThreadCount;
    const threads: Array<{ x: number; y: number; length: number }> = [];

    for (let i = 0; i < numThreads; i++) {
      // Position along the ribbon length (evenly distributed)
      const alongRibbonFraction = i / (numThreads - 1); // 0 to 1
      const alongRibbonDistance = alongRibbonFraction * ribbonTotalLength;

      // Calculate position along the ribbon centerline
      const baseX = ribbonStartX + Math.cos(angleRad) * alongRibbonDistance;
      const baseY = ribbonStartY + Math.sin(angleRad) * alongRibbonDistance;

      // Add some randomness perpendicular to ribbon (across the width)
      const randomPerp = (random() - 0.5) * ribbonWidth * 0.3; // ±15% of ribbon width
      const perpOffsetX = Math.cos(perpAngleRad) * randomPerp;
      const perpOffsetY = Math.sin(perpAngleRad) * randomPerp;

      const threadX = baseX + perpOffsetX;
      const threadY = baseY + perpOffsetY;

      // Random length similar to weave threads
      const minLength = CONFIG.weave.warpThreads.minLength;
      const maxLength = CONFIG.weave.warpThreads.maxLength;
      const lengthInches = minLength + random() * (maxLength - minLength);
      const length = lengthInches * SCALE;

      threads.push({ x: threadX, y: threadY, length });
    }

    // Draw the guide threads
    ctx.fillStyle = CONFIG.colors.guideThreads;
    ctx.globalAlpha = CONFIG.weave.opacity;

    for (const thread of threads) {
      const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.variation.thicknessVariation;
      const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

      drawThread(ctx, thread.x, thread.y, thread.length, angleRad, threadWidth);
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
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
      pattern: 'rings' | 'greekKey' | 'octagons' | 'artDeco' | 'curvedTowers';
      length: number;
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

    // Apply inset to pattern drawing area (5 inches on each side)
    const insetAmount = 5 * SCALE; // 5 inches per side
    const insetOffsetX = Math.cos(perpAngleRad) * insetAmount; // Offset to center pattern
    const insetOffsetY = Math.sin(perpAngleRad) * insetAmount;

    // Draw pattern segments along this ribbon
    let cumulativeDistance = 0;
    for (let i = 0; i < segmentArray.length; i++) {
      const segment = segmentArray[i];
      const segmentLengthPx = segment.length * 12 * SCALE; // Convert feet to pixels

      // Calculate segment position with inset offset
      const segmentX = ribbonStartX + Math.cos(angleRad) * cumulativeDistance + insetOffsetX;
      const segmentY = ribbonStartY + Math.sin(angleRad) * cumulativeDistance + insetOffsetY;

      // Extract colors from segment (handle both string and array for primary)
      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // ringColor
            background, // backgroundColor
            CONFIG.patterns.rings.ringRadius,
            insetAmount
          );
          break;
        case 'greekKey':
          drawGreekKey(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // patternColor
            background, // backgroundColor
            CONFIG.patterns.greekKey.keySize,
            insetAmount
          );
          break;
        case 'octagons':
          drawOctagons(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // octagonColor
            background, // backgroundColor
            CONFIG.patterns.octagons.octagonSize,
            insetAmount
          );
          break;
        case 'artDeco':
          drawArtDecoPattern(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // lineColor
            background, // backgroundColor
            CONFIG.patterns.artDeco.gridSize,
            insetAmount
          );
          break;
        case 'curvedTowers':
          drawCurvedTowers(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg,
            typeof primary === 'string' ? primary : primary[0], // lineColor
            background, // backgroundColor
            CONFIG.patterns.curvedTowers.tileSize,
            insetAmount
          );
          break;
      }

      // Draw gold border lines (2" outer gutter, 1.5" gold line, 1.5" inner gutter)
      drawGoldBorderLines(ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, angleDeg);

      // Accumulate distance for next segment
      cumulativeDistance += segmentLengthPx;
    }
  };

  const drawRibbons = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

      // drawSingleRibbon(
      //   ctx,
      //   angle,
      //   ribbonWidth,
      //   centerX,
      //   centerY,
      //   ribbonSpacing,
      //   layer.position,
      //   layer.segmentArray,
      //   layer.shift
      // );
    }

    // Draw guide threads for all ribbons first
    for (let i = 0; i < CONFIG.ribbons.layers.length; i++) {
      const layer = CONFIG.ribbons.layers[i];
      const angle = layer.direction === 'warp'
        ? CONFIG.weave.warpThreads.angle
        : CONFIG.weave.weftThreads.angle;

      drawGuideThreads(
        ctx,
        angle,
        ribbonWidth,
        centerX,
        centerY,
        ribbonSpacing,
        layer.position,
        layer.shift,
        i, // Pass layer index for unique seeding
        layer.segmentArray // Pass segment array to calculate ribbon length
      );
    }
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

    // Draw all ribbons (with guide threads)
    drawRibbons(ctx, width, height);

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
