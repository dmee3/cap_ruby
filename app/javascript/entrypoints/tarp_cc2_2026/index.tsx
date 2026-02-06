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
  const fabric1Ref = useRef<HTMLCanvasElement>(null);
  const fabric2Ref = useRef<HTMLCanvasElement>(null);
  const fabric3Ref = useRef<HTMLCanvasElement>(null);
  const fabric4Ref = useRef<HTMLCanvasElement>(null);
  const fabric5Ref = useRef<HTMLCanvasElement>(null);

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
    segmentArray: ReadonlyArray<{ length: number }>, // To calculate total ribbon length
    canvasWidth: number,
    canvasHeight: number
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

    // Apply clipping to tarp bounds (not including overhang)
    ctx.save();
    ctx.beginPath();
    const overhangPx = CANVAS_OVERHANG_FEET * 12 * SCALE;
    const tarpWidth = TARP_WIDTH_INCHES * SCALE;
    const tarpHeight = TARP_HEIGHT_INCHES * SCALE;
    ctx.rect(overhangPx, overhangPx, tarpWidth, tarpHeight);
    ctx.clip();

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

    ctx.restore();
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

    // Create seeded random for this ribbon's fraying but use a consistent seed value
    const random = createSeededRandom(43);

    // Frayed threads should align with the ribbon's own angle (warp or weft)
    // The ribbon angle IS the thread angle
    const threadAngleRad = ribbonAngleRad;

    // Number of frayed threads
    const numThreads = 40;

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
      // Use destination-out compositing to erase the triangular fraying sections
      // This ensures overlapping triangles always erase, never "un-erase"
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      // Draw each triangle as a filled shape with curved S-shaped sides to erase it
      for (const thread of threads) {
        const threadWidth = 3 * SCALE;
        const dx = thread.endX - thread.startX;
        const dy = thread.endY - thread.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(thread.startX, thread.startY);
        ctx.rotate(angle);

        // Calculate S-curve control points for thread-like appearance
        // Both curves bow outward (away from centerline) to avoid intersection
        const baseWidth = threadWidth * 2 / 3;
        const curveAmount = length * 0.15; // Curve control point offset (15% of length)

        ctx.beginPath();

        // Start at top-left corner of base
        ctx.moveTo(-baseWidth, -baseWidth);

        // Top edge (straight line across base)
        ctx.lineTo(-baseWidth, baseWidth);

        // Bottom edge (S-curve from bottom-left base to point)
        // For a true S-curve: first control point pulls one way, second pulls opposite way
        const cp1X = length * 0.33; // First control point at 1/3
        const cp1Y = baseWidth + curveAmount; // Pull outward (down)
        const cp2X = length * 0.67; // Second control point at 2/3
        const cp2Y = baseWidth - curveAmount; // Pull inward (up) - creates the S
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, length, 0);

        // Top edge (S-curve from point back to top-left base)
        // Mirror: first control point pulls one way, second pulls opposite
        const cp3X = length * 0.67; // First control point at 2/3 (going backward)
        const cp3Y = baseWidth - curveAmount; // Pull inward (down) - creates the S
        const cp4X = length * 0.33; // Second control point at 1/3
        const cp4Y = -baseWidth + curveAmount; // Pull outward (up)
        ctx.bezierCurveTo(cp3X, cp3Y, cp4X, cp4Y, -baseWidth, -baseWidth);

        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }
  };

  // Render a ribbon to an off-screen canvas and return it
  const renderRibbonToCanvas = (
    layerIndex: number
  ): HTMLCanvasElement => {
    const layer = CONFIG.ribbons.layers[layerIndex];
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE;
    const ribbonTotalLength = layer.segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);

    // Create off-screen canvas
    const canvas = document.createElement('canvas');

    // Check canvas size limits (most browsers max around 32,767 pixels per dimension)
    const maxCanvasSize = 32767;
    if (ribbonTotalLength > maxCanvasSize || ribbonWidth > maxCanvasSize) {
      console.warn(`Ribbon ${layerIndex} exceeds canvas limits: ${ribbonTotalLength} × ${ribbonWidth}. Max: ${maxCanvasSize}`);
      console.warn(`Ribbon will be rendered in display code using split method`);
      // Return a marker canvas - the split rendering will handle display
      canvas.width = 1;
      canvas.height = 1;
      return canvas;
    }

    canvas.width = ribbonTotalLength;
    canvas.height = ribbonWidth;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return canvas;
    }

    // Draw pattern segments horizontally
    const insetAmount = 5 * SCALE;
    let cumulativeX = 0;

    for (let i = 0; i < layer.segmentArray.length; i++) {
      const segment = layer.segmentArray[i];
      const segmentLengthPx = segment.length * 12 * SCALE;

      const segmentX = cumulativeX;
      const segmentY = 0;

      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0],
            background,
            CONFIG.patterns.rings.ringRadius,
            insetAmount
          );
          break;
        case 'greekKey':
          drawGreekKey(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0],
            background,
            CONFIG.patterns.greekKey.keySize,
            insetAmount
          );
          break;
        case 'octagons':
          drawOctagons(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0],
            background,
            CONFIG.patterns.octagons.octagonSize,
            insetAmount
          );
          break;
        case 'artDeco':
          drawArtDecoPattern(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0],
            background,
            CONFIG.patterns.artDeco.gridSize,
            insetAmount
          );
          break;
        case 'curvedTowers':
          drawCurvedTowers(
            ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0],
            background,
            CONFIG.patterns.curvedTowers.tileSize,
            insetAmount
          );
          break;
      }

      drawGoldBorderLines(ctx, segmentX, segmentY, segmentLengthPx, ribbonWidth, 0);

      // Apply fraying effect to first segment using destination-out compositing
      if (i === 0) {
        drawFrayingEffect(
          ctx,
          0,
          ribbonWidth / 2,
          ribbonWidth,
          0,
          5,
          layerIndex,
          true,
          segmentLengthPx
        );
      }

      cumulativeX += segmentLengthPx;
    }

    return canvas;
  };

  // Draw a pre-rendered ribbon canvas onto the main canvas at the correct position and angle
  const drawSingleRibbon = (
    ctx: CanvasRenderingContext2D,
    ribbonCanvas: HTMLCanvasElement,
    angleDeg: number,
    ribbonWidth: number,
    centerX: number,
    centerY: number,
    ribbonSpacing: number,
    position: 'center' | 'above' | 'below',
    shift: number,
    ribbonTotalLength: number
  ) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const perpAngleRad = angleRad + Math.PI / 2;

    const halfLength = ribbonTotalLength / 2;

    // Calculate where the centerline should start
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

    // Draw the pre-rendered ribbon canvas
    // ribbonStartX, ribbonStartY is the starting point along the centerline
    ctx.save();
    ctx.translate(ribbonStartX, ribbonStartY);
    ctx.rotate(angleRad);
    ctx.drawImage(ribbonCanvas, 0, -ribbonWidth / 2);
    ctx.restore();
  };

  const drawRibbons = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    ribbonCanvases: HTMLCanvasElement[]
  ) => {
    // Setup ribbon parameters from config
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE;
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
        i,
        layer.segmentArray,
        width,
        height
      );
    }

    // Draw pattern ribbons layer by layer (bottom to top)
    for (let i = 0; i < CONFIG.ribbons.layers.length; i++) {
      const layer = CONFIG.ribbons.layers[i];
      const angle = layer.direction === 'warp'
        ? CONFIG.weave.warpThreads.angle
        : CONFIG.weave.weftThreads.angle;

      const ribbonTotalLength = layer.segmentArray.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);

      drawSingleRibbon(
        ctx,
        ribbonCanvases[i],
        angle,
        ribbonWidth,
        centerX,
        centerY,
        ribbonSpacing,
        layer.position,
        layer.shift,
        ribbonTotalLength
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

    // Center is relative to tarp area (not canvas)
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

    // Calculate start position of ribbon (left/beginning edge along centerline)
    const ribbonStartX = ribbonCenterX - Math.cos(angleRad) * ribbonHalfLength;
    const ribbonStartY = ribbonCenterY - Math.sin(angleRad) * ribbonHalfLength;

    // Calculate end position of ribbon (right/end edge along centerline)
    const ribbonEndX = ribbonCenterX + Math.cos(angleRad) * ribbonHalfLength;
    const ribbonEndY = ribbonCenterY + Math.sin(angleRad) * ribbonHalfLength;

    // Direction vector
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);

    const tarpBounds = {
      xMin: 0,
      xMax: TARP_WIDTH_INCHES,
      yMin: 0,
      yMax: TARP_HEIGHT_INCHES
    };

    // Find where ribbon enters tarp from the start
    let distanceToTarpStart = 0;
    for (let t = 0; t <= ribbonTotalLength; t += 0.5) {
      const x = ribbonStartX + dx * t;
      const y = ribbonStartY + dy * t;

      if (x >= tarpBounds.xMin && x <= tarpBounds.xMax &&
        y >= tarpBounds.yMin && y <= tarpBounds.yMax) {
        distanceToTarpStart = t;
        break;
      }
    }

    // Find where ribbon exits tarp from the end
    let distanceToTarpEnd = ribbonTotalLength;
    for (let t = ribbonTotalLength; t >= 0; t -= 0.5) {
      const x = ribbonStartX + dx * t;
      const y = ribbonStartY + dy * t;

      if (x >= tarpBounds.xMin && x <= tarpBounds.xMax &&
        y >= tarpBounds.yMin && y <= tarpBounds.yMax) {
        distanceToTarpEnd = t;
        break;
      }
    }

    const startOverhang = distanceToTarpStart;
    const endOverhang = ribbonTotalLength - distanceToTarpEnd;

    const firstSegmentLength = layer.segmentArray[0].length * 12;
    const lastSegmentLength = layer.segmentArray[layer.segmentArray.length - 1].length * 12;

    return {
      startOverhang,
      endOverhang,
      firstSegmentLength,
      lastSegmentLength,
      firstSegmentOnTarp: Math.max(0, firstSegmentLength - startOverhang),
      lastSegmentOnTarp: Math.max(0, lastSegmentLength - endOverhang)
    };
  };

  const drawIndividualRibbon = (
    canvas: HTMLCanvasElement,
    ribbonCanvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match the pre-rendered ribbon
    canvas.width = ribbonCanvas.width;
    canvas.height = ribbonCanvas.height;

    // Simply copy the pre-rendered ribbon
    ctx.drawImage(ribbonCanvas, 0, 0);
  };

  // Special rendering for long ribbons that exceed canvas limits
  // Renders each half independently and displays them stacked vertically with a gap
  const drawIndividualRibbonSplit = (
    canvas: HTMLCanvasElement,
    layerIndex: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const layer = CONFIG.ribbons.layers[layerIndex];
    const ribbonWidth = CONFIG.ribbons.width * 12 * SCALE;

    // Calculate which segments go in each half
    const segments = layer.segmentArray;
    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
    const halfLength = totalLength / 2;

    let firstHalfSegments = [];
    let secondHalfSegments = [];
    let accumulated = 0;

    for (const segment of segments) {
      if (accumulated < halfLength) {
        firstHalfSegments.push(segment);
      } else {
        secondHalfSegments.push(segment);
      }
      accumulated += segment.length;
    }

    const firstHalfLength = firstHalfSegments.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);
    const secondHalfLength = secondHalfSegments.reduce((sum, seg) => sum + seg.length * 12 * SCALE, 0);
    const maxHalfLength = Math.max(firstHalfLength, secondHalfLength);

    const gapInches = 24; // 2 feet gap between halves
    const gapPx = gapInches * SCALE;

    // Canvas size: wide enough for longest half, tall enough for both halves plus gap
    canvas.width = maxHalfLength;
    canvas.height = ribbonWidth * 2 + gapPx;

    // Render first half at top
    const insetAmount = 5 * SCALE;
    let cumulativeX = 0;

    for (let i = 0; i < firstHalfSegments.length; i++) {
      const segment = firstHalfSegments[i];
      const segmentLengthPx = segment.length * 12 * SCALE;
      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.rings.ringRadius, insetAmount);
          break;
        case 'greekKey':
          drawGreekKey(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.greekKey.keySize, insetAmount);
          break;
        case 'octagons':
          drawOctagons(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.octagons.octagonSize, insetAmount);
          break;
        case 'artDeco':
          drawArtDecoPattern(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.artDeco.gridSize, insetAmount);
          break;
        case 'curvedTowers':
          drawCurvedTowers(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.curvedTowers.tileSize, insetAmount);
          break;
      }

      drawGoldBorderLines(ctx, cumulativeX, 0, segmentLengthPx, ribbonWidth, 0);

      // Apply fraying to first segment only
      if (i === 0) {
        drawFrayingEffect(ctx, 0, ribbonWidth / 2, ribbonWidth, 0, 5, layerIndex, true, segmentLengthPx);
      }

      cumulativeX += segmentLengthPx;
    }

    // Render second half at bottom
    cumulativeX = 0;
    const secondHalfY = ribbonWidth + gapPx;

    for (const segment of secondHalfSegments) {
      const segmentLengthPx = segment.length * 12 * SCALE;
      const { background, primary, accent } = segment.colors;

      switch (segment.pattern) {
        case 'rings':
          drawInterlockingRings(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.rings.ringRadius, insetAmount);
          break;
        case 'greekKey':
          drawGreekKey(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.greekKey.keySize, insetAmount);
          break;
        case 'octagons':
          drawOctagons(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.octagons.octagonSize, insetAmount);
          break;
        case 'artDeco':
          drawArtDecoPattern(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.artDeco.gridSize, insetAmount);
          break;
        case 'curvedTowers':
          drawCurvedTowers(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0,
            typeof primary === 'string' ? primary : primary[0], background,
            CONFIG.patterns.curvedTowers.tileSize, insetAmount);
          break;
      }

      drawGoldBorderLines(ctx, cumulativeX, secondHalfY, segmentLengthPx, ribbonWidth, 0);
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

    // Pre-render all ribbons to off-screen canvases
    const ribbonCanvases = CONFIG.ribbons.layers.map((_, index) => renderRibbonToCanvas(index));

    // MAIN CANVAS RENDERING COMMENTED OUT FOR INDIVIDUAL RIBBON EXPORT
    // Set canvas size based on tarp dimensions + overhang
    const width = CANVAS_WIDTH_INCHES * SCALE;
    const height = CANVAS_HEIGHT_INCHES * SCALE;
    // canvas.width = width;
    // canvas.height = height;

    // const overhangPx = CANVAS_OVERHANG_FEET * 12 * SCALE;
    // const tarpWidth = TARP_WIDTH_INCHES * SCALE;
    // const tarpHeight = TARP_HEIGHT_INCHES * SCALE;

    // // Fill entire canvas with black background (overhang area)
    // ctx.fillStyle = '#000';
    // ctx.fillRect(0, 0, width, height);

    // // Fill tarp area with dark grey background
    // ctx.fillStyle = CONFIG.colors.background;
    // ctx.fillRect(overhangPx, overhangPx, tarpWidth, tarpHeight);

    // // Use clipping region to only draw weave on tarp area
    // ctx.save();
    // ctx.beginPath();
    // ctx.rect(overhangPx, overhangPx, tarpWidth, tarpHeight);
    // ctx.clip();

    // // Draw woven thread texture only on tarp area (clipped)
    // drawWeave(ctx, width, height);

    // ctx.restore();

    // // Draw all ribbons (with guide threads) using pre-rendered canvases
    // drawRibbons(ctx, width, height, ribbonCanvases);

    // Draw individual ribbons on their display canvases
    CONFIG.ribbons.layers.forEach((_, index) => {
      const displayCanvas = ribbonCanvasRefs.current[index];
      if (displayCanvas) {
        // Use split rendering for ribbons 0 and 5 (center ribbons that are too long)
        if (index === 0 || index === 5) {
          // drawIndividualRibbonSplit(displayCanvas, index);
        } else {
          drawIndividualRibbon(displayCanvas, ribbonCanvases[index]);
        }
      }
    });

    // Initialize fabric canvases with patterns at half scale
    const fabricRefs = [fabric1Ref, fabric2Ref, fabric3Ref, fabric4Ref, fabric5Ref];
    const fabricWidthInches = 60;
    const fabricHeightInches = 72;

    // Define which pattern each fabric should use
    const fabricPatterns = [
      { pattern: 'rings' as const, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
      { pattern: 'greekKey' as const, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
      { pattern: 'octagons' as const, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
      { pattern: 'curvedTowers' as const, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
      { pattern: 'artDeco' as const, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
    ];

    fabricRefs.forEach((ref, index) => {
      if (ref.current) {
        const fabricCanvas = ref.current;
        const fabricCtx = fabricCanvas.getContext('2d');
        if (fabricCtx) {
          // Set canvas dimensions
          fabricCanvas.width = fabricWidthInches * SCALE;
          fabricCanvas.height = fabricHeightInches * SCALE;

          const fabricWidth = fabricWidthInches * SCALE;
          const fabricHeight = fabricHeightInches * SCALE;
          const { pattern, colors } = fabricPatterns[index];
          const { background, primary } = colors;

          // Inset amount (reduced to half for fabric - 2.5" instead of 5")
          const insetAmount = 2.5 * SCALE;

          // Draw pattern at 2x density by dividing the pattern size parameters by 2
          switch (pattern) {
            case 'rings':
              drawInterlockingRings(
                fabricCtx, 0, 0, fabricWidth, fabricHeight, 0,
                typeof primary === 'string' ? primary : primary[0],
                background,
                CONFIG.patterns.rings.ringRadius / 2, // Divide by 2 to make pattern 2x denser
                insetAmount,
                0.5, // Half line width
                true // Inset all sides
              );
              break;
            case 'greekKey':
              drawGreekKey(
                fabricCtx, 0, 0, fabricWidth, fabricHeight, 0,
                typeof primary === 'string' ? primary : primary[0],
                background,
                CONFIG.patterns.greekKey.keySize / 2, // Divide by 2 to make pattern 2x denser
                insetAmount,
                0.5, // Half line width
                true // Inset all sides
              );
              break;
            case 'octagons':
              drawOctagons(
                fabricCtx, 0, 0, fabricWidth, fabricHeight, 0,
                typeof primary === 'string' ? primary : primary[0],
                background,
                CONFIG.patterns.octagons.octagonSize / 2, // Divide by 2 to make pattern 2x denser
                insetAmount,
                true // Inset all sides
              );
              break;
            case 'curvedTowers':
              drawCurvedTowers(
                fabricCtx, 0, 0, fabricWidth, fabricHeight, 0,
                typeof primary === 'string' ? primary : primary[0],
                background,
                CONFIG.patterns.curvedTowers.tileSize / 2, // Divide by 2 to make pattern 2x denser
                insetAmount,
                0.5, // Half line width
                true // Inset all sides
              );
              break;
            case 'artDeco':
              drawArtDecoPattern(
                fabricCtx, 0, 0, fabricWidth, fabricHeight, 0,
                typeof primary === 'string' ? primary : primary[0],
                background,
                CONFIG.patterns.artDeco.gridSize / 2, // Divide by 2 to make pattern 2x denser
                insetAmount
              );
              break;
          }

          // Draw gold border lines on all 4 sides with half width
          drawGoldBorderLines(fabricCtx, 0, 0, fabricWidth, fabricHeight, 0, true, 0.5);
        }
      }
    });

    // Cleanup function to clear canvas on unmount
    return () => {
      ctx.clearRect(0, 0, width, height);
    };
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

      {/* Fabric canvases */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Fabric 1 - Rings</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>60" × 72" (6 ft) - 2× Density</p>
          <canvas
            ref={fabric1Ref}
            style={{
              border: '1px solid #ccc',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Fabric 2 - Greek Key</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>60" × 72" (6 ft) - 2× Density</p>
          <canvas
            ref={fabric2Ref}
            style={{
              border: '1px solid #ccc',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Fabric 3 - Octagons</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>60" × 72" (6 ft) - 2× Density</p>
          <canvas
            ref={fabric3Ref}
            style={{
              border: '1px solid #ccc',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Fabric 4 - Curved Towers</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>60" × 72" (6 ft) - 2× Density</p>
          <canvas
            ref={fabric4Ref}
            style={{
              border: '1px solid #ccc',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold', color: '#000' }}>Fabric 5 - Art Deco</h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>60" × 72" (6 ft) - 2× Density</p>
          <canvas
            ref={fabric5Ref}
            style={{
              border: '1px solid #ccc',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        </div>
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
