import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Import configuration and utilities
import { TARP_WIDTH_INCHES, TARP_HEIGHT_INCHES, CANVAS_WIDTH_INCHES, CANVAS_HEIGHT_INCHES, CANVAS_OVERHANG_FEET, SCALE, CONFIG } from './config';

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
  const ribbonCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

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

  // Helper function to create fraying clipping path
  const createFrayingClipPath = (
    ctx: CanvasRenderingContext2D,
    ribbonStartX: number,
    ribbonStartY: number,
    ribbonWidth: number,
    ribbonAngleDeg: number,
    frayLengthFeet: number = 5,
    ribbonIndex: number = 0
  ) => {
    const ribbonAngleRad = (ribbonAngleDeg * Math.PI) / 180;
    const perpAngleRad = ribbonAngleRad + Math.PI / 2;
    const frayLengthPx = frayLengthFeet * 12 * SCALE;

    // Create seeded random for this ribbon's fraying
    const random = createSeededRandom(CONFIG.weave.seed + ribbonIndex * 5000);

    // Frayed threads should align with the ribbon's own angle (warp or weft)
    // The ribbon angle IS the thread angle
    const threadAngleRad = ribbonAngleRad;

    // Number of frayed threads (reduced to 2/3 of original 30)
    const numThreads = 20;

    // Generate thread positions
    const threads: Array<{ startX: number; startY: number; endX: number; endY: number; length: number; angle: number }> = [];

    for (let i = 0; i < numThreads; i++) {
      // Random position across ribbon width
      const widthProgress = random();
      const perpOffset = (widthProgress - 0.5) * ribbonWidth;
      const perpOffsetX = Math.cos(perpAngleRad) * perpOffset;
      const perpOffsetY = Math.sin(perpAngleRad) * perpOffset;

      // Thread starts at the ribbon edge (not random along the fray zone)
      const threadStartX = ribbonStartX + perpOffsetX;
      const threadStartY = ribbonStartY + perpOffsetY;

      // Random length for each thread (shorter = more frayed)
      const lengthVariation = 0.3 + random() * 0.7; // 30% to 100% of fray length
      const threadLength = frayLengthPx * lengthVariation;

      // Thread extends along the ribbon's angle (warp or weft)
      const threadEndX = threadStartX + Math.cos(threadAngleRad) * threadLength;
      const threadEndY = threadStartY + Math.sin(threadAngleRad) * threadLength;

      threads.push({ startX: threadStartX, startY: threadStartY, endX: threadEndX, endY: threadEndY, length: threadLength, angle: threadAngleRad });
    }

    return threads;
  };

  // Helper function to draw fraying effect at the start of a ribbon
  const drawFrayingEffect = (
    ctx: CanvasRenderingContext2D,
    ribbonStartX: number,
    ribbonStartY: number,
    ribbonWidth: number,
    angleDeg: number,
    frayLengthFeet: number = 5,
    ribbonIndex: number = 0,
    applyClipping: boolean = false,
    segmentLengthPx?: number
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;

    // Create seeded random for this ribbon's fraying
    const random = createSeededRandom(CONFIG.weave.seed + ribbonIndex * 5000);

    // Get thread positions
    const threads = createFrayingClipPath(ctx, ribbonStartX, ribbonStartY, ribbonWidth, angleDeg, frayLengthFeet, ribbonIndex);

    // Apply clipping if requested
    if (applyClipping && segmentLengthPx) {
      ctx.save();

      // Create the clipping region in local coordinate system (no rotation)
      ctx.beginPath();
      ctx.rect(ribbonStartX, ribbonStartY - ribbonWidth / 2, segmentLengthPx, ribbonWidth);

      // Cut out thread shapes directly in world coordinates
      for (const thread of threads) {
        const threadWidth = 3 * SCALE;
        const dx = thread.endX - thread.startX;
        const dy = thread.endY - thread.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(thread.startX, thread.startY);
        ctx.rotate(angle);
        ctx.moveTo(-threadWidth / 2, -threadWidth / 2);
        ctx.lineTo(-threadWidth / 2, threadWidth / 2);
        ctx.lineTo(length, 0);
        ctx.lineTo(-threadWidth / 2, -threadWidth / 2);
        ctx.restore();
      }

      ctx.clip('evenodd');
    }

    for (const thread of threads) {
      // Thinner threads
      const threadWidth = (0.5 + random() * 1) * SCALE; // 0.5-1.5 pixels at SCALE=1

      ctx.lineWidth = threadWidth;
      ctx.strokeStyle = '#dec573'; // Gold with 100% opacity
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(thread.startX, thread.startY);
      ctx.lineTo(thread.endX, thread.endY);
      ctx.stroke();
    }

    if (applyClipping) {
      ctx.restore();
    }
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
    shift: number, // Shift along ribbon direction in feet (positive = forward along angle direction)
    ribbonIndex: number = 0 // Index for seeded randomness
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const perpAngleRad = angleRad + Math.PI / 2;

    // Calculate total ribbon length from segment array (convert feet to pixels)
    const ribbonTotalLength = segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);
    const halfLength = ribbonTotalLength / 2;

    // Calculate where the centerline should start (beginning of the ribbon)
    const centerlineStartX = centerX - Math.cos(angleRad) * halfLength;
    const centerlineStartY = centerY - Math.sin(angleRad) * halfLength;

    // The pattern drawing functions rotate around their center point, so we position
    // each segment at its start point along the centerline. The perpendicular offset
    // accounts for the ribbon width centering.
    const baseRibbonStartX = centerlineStartX;
    const baseRibbonStartY = centerlineStartY - ribbonWidth / 2;

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

      // Calculate segment center position along the ribbon centerline
      // Each segment starts at cumulativeDistance and extends segmentLengthPx
      const segmentCenterDistance = cumulativeDistance + segmentLengthPx / 2;

      // Position the segment (pattern functions translate to their own center)
      const segmentX = ribbonStartX + Math.cos(angleRad) * segmentCenterDistance - segmentLengthPx / 2 + insetOffsetX;
      const segmentY = ribbonStartY + Math.sin(angleRad) * segmentCenterDistance + insetOffsetY;

      // Apply fraying clip path to first segment
      if (i === 0) {
        ctx.save();

        // Create clipping path that excludes the frayed area
        const frayLengthPx = 5 * 12 * SCALE; // 5 feet
        const threads = createFrayingClipPath(ctx, ribbonStartX, ribbonStartY + ribbonWidth / 2, ribbonWidth, angleDeg, 5, ribbonIndex);

        // Create a rotated rectangle for the segment (aligned with ribbon angle)
        ctx.beginPath();
        // First, establish the coordinate system for the segment
        ctx.save();
        ctx.translate(ribbonStartX, ribbonStartY + ribbonWidth / 2);
        ctx.rotate(angleRad);

        // Draw the outer rectangle
        ctx.rect(0, -ribbonWidth / 2, segmentLengthPx, ribbonWidth);

        // Cut out areas where threads are - but in the LOCAL coordinate system
        for (const thread of threads) {
          const threadWidth = 3 * SCALE; // Slightly wider clip than visual thread

          // Transform thread positions to local coordinates
          // Inverse transform: rotate back and translate back
          const localStartX = (thread.startX - ribbonStartX) * Math.cos(-angleRad) - (thread.startY - (ribbonStartY + ribbonWidth / 2)) * Math.sin(-angleRad);
          const localStartY = (thread.startX - ribbonStartX) * Math.sin(-angleRad) + (thread.startY - (ribbonStartY + ribbonWidth / 2)) * Math.cos(-angleRad);
          const localEndX = (thread.endX - ribbonStartX) * Math.cos(-angleRad) - (thread.endY - (ribbonStartY + ribbonWidth / 2)) * Math.sin(-angleRad);
          const localEndY = (thread.endX - ribbonStartX) * Math.sin(-angleRad) + (thread.endY - (ribbonStartY + ribbonWidth / 2)) * Math.cos(-angleRad);

          const dx = localEndX - localStartX;
          const dy = localEndY - localStartY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Create a tapered shape for the thread in local coordinates
          ctx.save();
          ctx.translate(localStartX, localStartY);
          ctx.rotate(angle);

          // Draw a triangle/tapered shape
          ctx.moveTo(-threadWidth / 2, -threadWidth / 2); // Top left
          ctx.lineTo(-threadWidth / 2, threadWidth / 2);  // Bottom left
          ctx.lineTo(length, 0);                       // Point at end
          ctx.lineTo(-threadWidth / 2, -threadWidth / 2); // Close path

          ctx.restore();
        }

        ctx.restore();

        ctx.clip();
      }

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

      // Restore clipping for first segment
      if (i === 0) {
        ctx.restore();

        // Now draw fraying effect on top with clipping
        drawFrayingEffect(
          ctx,
          ribbonStartX,
          ribbonStartY + ribbonWidth / 2, // Center vertically on the ribbon
          ribbonWidth,
          angleDeg,
          5, // 5 feet of fraying
          ribbonIndex,
          true, // Apply clipping
          segmentLengthPx
        );
      }

      // Accumulate distance for next segment
      cumulativeDistance += segmentLengthPx;
    }
  };

  const drawRibbons = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Setup ribbon parameters from config
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE; // Convert feet to inches, then to pixels
    const ribbonSpacing = ribbonWidth * CONFIG.ribbons.spacingMultiplier;
    // Center ribbons on the tarp area (not the full canvas)
    const overhangPx = CANVAS_OVERHANG_FEET * 12 * SCALE;
    const centerX = overhangPx + (TARP_WIDTH_INCHES * SCALE) / 2;
    const centerY = overhangPx + (TARP_HEIGHT_INCHES * SCALE) / 2;

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

    // Draw pattern ribbons layer by layer (bottom to top)
    for (let i = 0; i < CONFIG.ribbons.layers.length; i++) {
      const layer = CONFIG.ribbons.layers[i];
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
        layer.shift,
        i // Pass ribbon index for seeded randomness
      );
    }
  };

  // Helper function to calculate ribbon overhang at both ends
  const calculateRibbonOverhang = (layerIndex: number) => {
    const layer = CONFIG.ribbons.layers[layerIndex];
    const ribbonWidth = CONFIG.ribbons.width * 12; // Convert feet to inches
    const ribbonSpacing = ribbonWidth * CONFIG.ribbons.spacingMultiplier;

    const angle = layer.direction === 'warp'
      ? CONFIG.weave.warpThreads.angle
      : CONFIG.weave.weftThreads.angle;
    const angleRad = (angle * Math.PI) / 180;
    const perpAngleRad = angleRad + Math.PI / 2;

    const centerX = TARP_WIDTH_INCHES / 2;
    const centerY = TARP_HEIGHT_INCHES / 2;

    // Calculate position offset based on ribbon position
    let positionOffsetX = 0;
    let positionOffsetY = 0;

    if (layer.position === 'above') {
      positionOffsetX = Math.cos(perpAngleRad) * ribbonSpacing;
      positionOffsetY = Math.sin(perpAngleRad) * ribbonSpacing;
    } else if (layer.position === 'below') {
      positionOffsetX = -Math.cos(perpAngleRad) * ribbonSpacing;
      positionOffsetY = -Math.sin(perpAngleRad) * ribbonSpacing;
    }

    // Apply directional shift
    const shiftInches = layer.shift * 12;
    const shiftOffsetX = Math.cos(angleRad) * shiftInches;
    const shiftOffsetY = Math.sin(angleRad) * shiftInches;

    const ribbonCenterX = centerX + positionOffsetX + shiftOffsetX;
    const ribbonCenterY = centerY + positionOffsetY + shiftOffsetY;

    // Calculate total ribbon length
    const ribbonTotalLength = layer.segmentArray.reduce((sum, seg) => sum + seg.length * 12, 0);
    const ribbonHalfLength = ribbonTotalLength / 2;

    // Calculate distance to tarp edges in both directions
    // Direction vector
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);

    // Find intersection with tarp boundaries in negative direction (toward start)
    let tStart = -ribbonHalfLength * 2; // Start well before
    const tarpBounds = {
      xMin: 0,
      xMax: TARP_WIDTH_INCHES,
      yMin: 0,
      yMax: TARP_HEIGHT_INCHES
    };

    // Find where ribbon exits tarp at the start (negative direction)
    for (let t = -ribbonHalfLength; t <= 0; t += 1) {
      const x = ribbonCenterX + dx * t;
      const y = ribbonCenterY + dy * t;

      if (x >= tarpBounds.xMin && x <= tarpBounds.xMax &&
        y >= tarpBounds.yMin && y <= tarpBounds.yMax) {
        tStart = t;
        break;
      }
    }

    // Find where ribbon exits tarp at the end (positive direction)
    let tEnd = ribbonHalfLength * 2; // Start well after
    for (let t = ribbonHalfLength; t >= 0; t -= 1) {
      const x = ribbonCenterX + dx * t;
      const y = ribbonCenterY + dy * t;

      if (x >= tarpBounds.xMin && x <= tarpBounds.xMax &&
        y >= tarpBounds.yMin && y <= tarpBounds.yMax) {
        tEnd = t;
        break;
      }
    }

    const startOverhang = Math.abs(tStart) - ribbonHalfLength;
    const endOverhang = tEnd - ribbonHalfLength;

    const firstSegmentLength = layer.segmentArray[0].length * 12;
    const lastSegmentLength = layer.segmentArray[layer.segmentArray.length - 1].length * 12;

    return {
      startOverhang: Math.abs(startOverhang),
      endOverhang: Math.abs(endOverhang),
      firstSegmentLength,
      lastSegmentLength,
      firstSegmentOnTarp: Math.max(0, firstSegmentLength - Math.abs(startOverhang)),
      lastSegmentOnTarp: Math.max(0, lastSegmentLength - Math.abs(endOverhang))
    };
  };

  const drawIndividualRibbon = (
    canvas: HTMLCanvasElement,
    layerIndex: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layer = CONFIG.ribbons.layers[layerIndex];
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE; // Convert feet to inches, then to pixels

    // Calculate total ribbon length
    const ribbonTotalLength = layer.segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);

    // Set canvas dimensions: width = total length, height = ribbon width (horizontal orientation)
    canvas.width = ribbonTotalLength;
    canvas.height = ribbonWidth;

    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ribbonTotalLength, ribbonWidth);

    // Draw pattern segments horizontally
    const insetAmount = 5 * SCALE; // 5 inches per side
    let cumulativeX = 0;

    for (let i = 0; i < layer.segmentArray.length; i++) {
      const segment = layer.segmentArray[i];
      const segmentLengthPx = segment.length * 12 * SCALE; // Convert feet to pixels

      // Position at (cumulativeX, 0) for horizontal stacking
      const segmentX = cumulativeX;
      const segmentY = 0;

      // Apply fraying clip path to first segment
      if (i === 0) {
        ctx.save();

        // Create clipping path that excludes the frayed area
        const frayLengthPx = 5 * 12 * SCALE; // 5 feet
        const threads = createFrayingClipPath(ctx, 0, ribbonWidth / 2, ribbonWidth, 0, 5, layerIndex);

        // Create a rectangle for the segment (horizontal, no rotation needed)
        ctx.beginPath();
        ctx.rect(0, 0, segmentLengthPx, ribbonWidth);

        // Cut out areas where threads are using composite operation
        for (const thread of threads) {
          const threadWidth = 3 * SCALE; // Slightly wider clip than visual thread
          const dx = thread.endX - thread.startX;
          const dy = thread.endY - thread.startY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Create a tapered shape for the thread (rectangle at start, point at end)
          ctx.save();
          ctx.translate(thread.startX, thread.startY);
          ctx.rotate(angle);

          // Draw a triangle/tapered shape
          ctx.moveTo(-threadWidth / 2, -threadWidth / 2); // Top left
          ctx.lineTo(-threadWidth / 2, threadWidth / 2);  // Bottom left
          ctx.lineTo(length, 0);                       // Point at end
          ctx.lineTo(-threadWidth / 2, -threadWidth / 2); // Close path

          ctx.restore();
        }

        ctx.clip(); // Use even-odd rule to create holes
      }

      // Extract colors from segment (handle both string and array for primary)
      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0, // width and height swapped for horizontal
            typeof primary === 'string' ? primary : primary[0], // ringColor
            background, // backgroundColor
            CONFIG.patterns.rings.ringRadius,
            insetAmount
          );
          break;
        case 'greekKey':
          drawGreekKey(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], // patternColor
            background, // backgroundColor
            CONFIG.patterns.greekKey.keySize,
            insetAmount
          );
          break;
        case 'octagons':
          drawOctagons(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], // octagonColor
            background, // backgroundColor
            CONFIG.patterns.octagons.octagonSize,
            insetAmount
          );
          break;
        case 'artDeco':
          drawArtDecoPattern(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], // lineColor
            background, // backgroundColor
            CONFIG.patterns.artDeco.gridSize,
            insetAmount
          );
          break;
        case 'curvedTowers':
          drawCurvedTowers(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], // lineColor
            background, // backgroundColor
            CONFIG.patterns.curvedTowers.tileSize,
            insetAmount
          );
          break;
      }

      // Draw gold border lines (2" outer gutter, 1.5" gold line, 1.5" inner gutter)
      drawGoldBorderLines(ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0);

      // Restore clipping for first segment
      if (i === 0) {
        ctx.restore();

        // Now draw fraying effect on top with clipping
        drawFrayingEffect(
          ctx,
          0,
          ribbonWidth / 2, // Center vertically on the ribbon
          ribbonWidth,
          0, // Horizontal orientation
          5, // 5 feet of fraying
          layerIndex,
          true, // Apply clipping
          segmentLengthPx
        );
      }

      // Accumulate distance for next segment
      cumulativeX += segmentLengthPx;
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

    // Set canvas size based on tarp dimensions + overhang
    const width = CANVAS_WIDTH_INCHES * SCALE;
    const height = CANVAS_HEIGHT_INCHES * SCALE;
    canvas.width = width;
    canvas.height = height;

    const overhangPx = CANVAS_OVERHANG_FEET * 12 * SCALE;
    const tarpWidth = TARP_WIDTH_INCHES * SCALE;
    const tarpHeight = TARP_HEIGHT_INCHES * SCALE;

    // Fill entire canvas with white background (overhang area)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Fill tarp area with dark grey background
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(overhangPx, overhangPx, tarpWidth, tarpHeight);

    // Use clipping region to only draw weave on tarp area
    ctx.save();
    ctx.beginPath();
    ctx.rect(overhangPx, overhangPx, tarpWidth, tarpHeight);
    ctx.clip();

    // Draw woven thread texture only on tarp area (clipped)
    drawWeave(ctx, width, height);

    ctx.restore();

    // Draw all ribbons (with guide threads) - they'll extend beyond tarp into overhang
    drawRibbons(ctx, width, height);

    // Cleanup function to clear canvas on unmount
    return () => {
      ctx.clearRect(0, 0, width, height);
    };
  }, []);

  useEffect(() => {
    // Draw individual ribbons on their own canvases
    CONFIG.ribbons.layers.forEach((_, index) => {
      const canvas = ribbonCanvasRefs.current[index];
      if (canvas) {
        drawIndividualRibbon(canvas, index);
      }
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '40px' }}>
      {/* Main tarp canvas */}
      <div>
        <h2 style={{ color: '#fff', marginBottom: '10px' }}>Full Tarp</h2>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>

      {/* Individual ribbon canvases */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        {CONFIG.ribbons.layers.map((layer, index) => {
          const totalLength = layer.segmentArray.reduce((sum, seg) => sum + seg.length, 0);
          const overhang = calculateRibbonOverhang(index);
          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
              <div style={{ color: '#000', marginBottom: '10px', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  Ribbon {index + 1}
                </h3>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <div>Direction: {layer.direction.toUpperCase()}</div>
                  <div>Position: {layer.position.charAt(0).toUpperCase() + layer.position.slice(1)}</div>
                  <div>Shift: {layer.shift > 0 ? '+' : ''}{layer.shift} feet</div>
                  <div>Length: {totalLength} feet</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Overhang:</div>
                  <div>Start: {overhang.startOverhang.toFixed(1)}" ({(overhang.startOverhang / 12).toFixed(2)} ft)</div>
                  <div>End: {overhang.endOverhang.toFixed(1)}" ({(overhang.endOverhang / 12).toFixed(2)} ft)</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }}>
                    First segment: {overhang.firstSegmentOnTarp.toFixed(1)}" on / {(overhang.firstSegmentLength - overhang.firstSegmentOnTarp).toFixed(1)}" off
                  </div>
                  <div style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    Last segment: {overhang.lastSegmentOnTarp.toFixed(1)}" on / {(overhang.lastSegmentLength - overhang.lastSegmentOnTarp).toFixed(1)}" off
                  </div>
                </div>
              </div>
              <canvas
                ref={(el) => (ribbonCanvasRefs.current[index] = el)}
                style={{
                  border: '1px solid #ccc',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          );
        })}
      </div>
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
