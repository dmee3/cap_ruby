import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Type definition for ring configuration
interface RingConfig {
  centerX: number;
  centerY: number;
  maxRadius: number;
  minRadius: number;
  baseOpacity: number;
  numRings: number;
  isCenterWave?: boolean;
  rippleIndex?: number;
  totalRipples?: number;
}

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
  // Ripple wave configuration
  ripple: {
    numRipplesPerWave: 7,
    edgeMargin: 108, // Horizontal distance from edge for outer ripples (in inches at SCALE=1)
    waveAmplitude: 75, // Height of the sine wave (in inches at SCALE=1)
  },
  // Ring styling
  ring: {
    maxLineWidth: 10, // Thickest line for innermost rings (in pixels at SCALE=1)
    minLineWidth: 1, // Thinnest line for outermost rings (in pixels at SCALE=1)
    radiusGrowth: 1.1, // Power factor for ring radius spacing
  },
  // Wave layout
  wave: {
    count: 5,
    topMargin: 180, // Distance from top edge (in inches)
    bottomMargin: 170, // Distance from bottom edge (in inches)
  },
  // Arc/mask configuration
  arc: {
    depthFeet: 6, // How deep the curved edges cut into the tarp (in feet)
    morseInsetInches: 18, // How far to inset morse code from the edge (in inches)
  },
  // Morse code configuration
  morse: {
    topText: 'MOVE MOVE MOVE MOVE MOVE',
    bottomText: 'VE MOVE MOVE MOVE MOVE MO',
    dotSize: 6, // Radius for dots (in inches at SCALE=1)
    dashWidth: 15, // Width for dashes (in inches at SCALE=1)
    dashHeight: 12, // Height for dashes (in inches at SCALE=1)
    symbolSpacing: 15, // Space between symbols (in inches at SCALE=1)
    letterSpacing: 15, // Space between letters (in inches at SCALE=1)
  },
  // Colors
  colors: {
    background: '#051526', // Dark blue-gray for edges
    // backgroundCenter: '#153b46', // Dark blue-gray for edges
    backgroundCenter: '#14476e', // Brighter blue-gray for center
    teal: '#02aaa2', // Bright teal for center wave
    blue: '#005a50', // Dark teal for other waves
    outsideRippleCenterRing: '#85e600', // Chartreuse green for the outside ripple center ring
    centerRippleInnerRing: '#ec67f0', // Pink/magenta for the very center ripple

  },
} as const;

const TarpCanvas2026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper function to convert hex color to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex; // Fallback to original color
  };

  // Function to draw a single wave of ripples with a specific color
  const drawRippleWaveWithColor = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, color: string, opacityRange?: { min: number; max: number }, isCenterWave?: boolean) => {
    const numRipples = CONFIG.ripple.numRipplesPerWave;
    const edgeMargin = CONFIG.ripple.edgeMargin * SCALE;

    for (let i = 0; i < numRipples; i++) {
      const progress = i / (numRipples - 1); // 0 to 1

      // Apply gentle easing to horizontal position: slightly tighter at center, slightly wider at edges
      // Uses power of 1.3 for subtle effect
      let horizontalProgress;
      if (progress < 0.5) {
        // First half: ease-out (starts fast, slows down toward center)
        const t = progress * 2; // Map [0, 0.5] to [0, 1]
        horizontalProgress = (1 - Math.pow(1 - t, 1.3)) * 0.5;
      } else {
        // Second half: ease-in (starts slow from center, speeds up toward edge)
        const t = (progress - 0.5) * 2; // Map [0.5, 1] to [0, 1]
        horizontalProgress = 0.5 + Math.pow(t, 1.3) * 0.5;
      }

      // X position: spread from left edge to right edge with eased spacing
      let x = edgeMargin + (canvasWidth - 2 * edgeMargin) * horizontalProgress;

      // Y position: wave pattern with peak on left, trough on right
      const waveAmplitude = CONFIG.ripple.waveAmplitude * SCALE;
      const wavePhase = progress * 2 * Math.PI; // Creates wave from 0 to 2π (full cycle)
      const baseY = canvasHeight / 2;
      let y = baseY + Math.sin(wavePhase) * waveAmplitude;

      // Adjustments to snap ripples to grid lines (applied to all waves)
      if (i === 0) {
        y += 40 * SCALE;
      } else if (i === 1) {
        y += 18 * SCALE;
        x += 3 * SCALE;
      } else if (i === 2) {
        y += -7 * SCALE;
        x += -4 * SCALE;
      } else if (i === 3) {
        y += -5 * SCALE;
      } else if (i === 4) {
        y += 3 * SCALE;
        x += 4 * SCALE;
      } else if (i === 5) {
        y += 4 * SCALE;
        x += -3 * SCALE;
      } else if (i === 6) {
        y += 40 * SCALE;
      }

      // Calculate distance from center ripple (index 3 is center)
      const centerIndex = Math.floor(numRipples / 2); // 3
      const distanceFromCenter = Math.abs(i - centerIndex); // 0, 1, 2, or 3

      // Define ripple diameters in feet based on distance from center
      // Array index = distanceFromCenter (0=center, 1=next out, 2=next out, 3=outermost)
      const rippleDiameters = [9, 12, 15, 18] as const; // feet diameter

      // Define number of concentric rings based on distance from center
      const numRingsArray = [4, 5, 6, 7] as const; // number of rings

      // Use safe array access with bounds checking
      const maxDefinedDistance = rippleDiameters.length - 1;
      const safeDistance = Math.min(distanceFromCenter, maxDefinedDistance);
      const diameterFeet = rippleDiameters[safeDistance];
      const diameterInches = diameterFeet * 12;
      const maxRadius = (diameterInches / 2) * SCALE; // Convert diameter to radius in pixels
      const minRadius = maxRadius / 8; // Inner radius is 1/8 of outer radius
      const numRings = numRingsArray[safeDistance];

      // Opacity: more opaque at edges, less opaque at center
      const maxDistanceFromCenter = Math.floor(numRipples / 2);
      const opacityProgress = distanceFromCenter / maxDistanceFromCenter; // 0 at center, 1 at edges
      const baseOpacity = opacityRange
        ? opacityRange.min + (opacityRange.max - opacityRange.min) * opacityProgress
        : 0.3 + (0.2 * opacityProgress); // 0.3 at center, 0.5 at edges

      drawConcentricRingsWithColor(ctx, {
        centerX: x,
        centerY: y,
        maxRadius,
        minRadius,
        baseOpacity,
        color,
        numRings,
        isCenterWave,
        rippleIndex: i,
        totalRipples: numRipples
      });
    }
  };

  // Function to draw concentric rings with a specific color
  const drawConcentricRingsWithColor = (ctx: CanvasRenderingContext2D, config: RingConfig & { color: string }) => {
    // Parse main color once upfront for performance
    let baseR: number, baseG: number, baseB: number;
    const rgbaMatch = config.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      baseR = parseInt(rgbaMatch[1], 10);
      baseG = parseInt(rgbaMatch[2], 10);
      baseB = parseInt(rgbaMatch[3], 10);
    } else if (config.color.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(config.color);
      if (result) {
        baseR = parseInt(result[1], 16);
        baseG = parseInt(result[2], 16);
        baseB = parseInt(result[3], 16);
      } else {
        console.error('Invalid hex color:', config.color);
        return;
      }
    } else {
      console.error('Unsupported color format:', config.color);
      return;
    }

    // Parse inner ring colors for center wave
    let innerR: number | undefined, innerG: number | undefined, innerB: number | undefined;
    let outsideInnerR: number | undefined, outsideInnerG: number | undefined, outsideInnerB: number | undefined;

    if (config.isCenterWave) {
      // Parse center ripple inner ring color (for middle ripple)
      const innerColor = CONFIG.colors.centerRippleInnerRing;
      const innerResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(innerColor);
      if (innerResult) {
        innerR = parseInt(innerResult[1], 16);
        innerG = parseInt(innerResult[2], 16);
        innerB = parseInt(innerResult[3], 16);
      }

      // Parse outside ripple center ring color (for first/last ripples)
      const outsideColor = CONFIG.colors.outsideRippleCenterRing;
      const outsideResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(outsideColor);
      if (outsideResult) {
        outsideInnerR = parseInt(outsideResult[1], 16);
        outsideInnerG = parseInt(outsideResult[2], 16);
        outsideInnerB = parseInt(outsideResult[3], 16);
      }
    }

    for (let i = 0; i < config.numRings; i++) {
      // Calculate radius - inner rings closer together, outer rings more spaced
      const progress = i / (config.numRings - 1);

      // Calculate radius using configured growth factor
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, CONFIG.ring.radiusGrowth);

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = CONFIG.ring.maxLineWidth * SCALE;
      const minLineWidth = CONFIG.ring.minLineWidth * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = config.baseOpacity;
      const minOpacity = 0.1;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Apply color with calculated opacity
      // For center wave, use special colors for innermost ring based on ripple position
      if (config.isCenterWave && i === 0) {
        const isFirstOrLastRipple = config.rippleIndex === 0 || config.rippleIndex === (config.totalRipples ?? 0) - 1;
        const isCenterRipple = config.rippleIndex === 3;

        if ((isFirstOrLastRipple) && outsideInnerR !== undefined && outsideInnerG !== undefined && outsideInnerB !== undefined) {
          // First or last ripple: use outsideRippleCenterRing color
          ctx.strokeStyle = `rgba(${outsideInnerR}, ${outsideInnerG}, ${outsideInnerB}, ${opacity})`;
        } else if (innerR !== undefined && innerG !== undefined && innerB !== undefined) {
          // Middle ripples: use centerRippleInnerRing color
          ctx.strokeStyle = `rgba(${innerR}, ${innerG}, ${innerB}, ${opacity})`;
        } else {
          ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${opacity})`;
        }
      } else {
        ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${opacity})`;
      }
      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(config.centerX, config.centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // Function to draw ripples layer (rendered on top of morse code, below masks)
  const drawRipplesLayer = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    // Draw multiple waves of ripples from top to bottom
    drawMultipleRippleWaves(ctx, canvasWidth, canvasHeight);
  };

  // Function to create a clipping path for the tarp shape (curved top and bottom edges)
  const createTarpClipPath = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const arcDepthInches = CONFIG.arc.depthFeet * 12; // Convert feet to inches

    // Calculate circular arc parameters
    // For an arc spanning width W with depth D:
    // radius = (W^2 + 4*D^2) / (8*D)
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    // Bottom arc parameters
    const bottomCenterX = (canvasWidth / 2);
    const bottomCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;
    const bottomY = TARP_HEIGHT_INCHES * SCALE;

    // Calculate angles for the bottom arc
    const bottomStartAngle = Math.atan2(bottomY - bottomCenterY, 0 - bottomCenterX);
    const bottomEndAngle = Math.atan2(bottomY - bottomCenterY, canvasWidth - bottomCenterX);

    // Top arc parameters
    const topCenterX = bottomCenterX;
    const topCenterY = bottomCenterY - (TARP_HEIGHT_INCHES - 2 * arcDepthInches) * SCALE; // Shift up by 48 feet
    const topArcRadius = radius * SCALE;

    // Calculate angles for the top arc at the left and right edges
    const leftX = 0;
    const rightX = canvasWidth;

    const topLeftDx = leftX - topCenterX;
    const topLeftDySquared = topArcRadius * topArcRadius - topLeftDx * topLeftDx;
    const topRightDx = rightX - topCenterX;
    const topRightDySquared = topArcRadius * topArcRadius - topRightDx * topRightDx;

    const topLeftY = topCenterY - Math.sqrt(topLeftDySquared);
    const topRightY = topCenterY - Math.sqrt(topRightDySquared);

    const topStartAngle = Math.atan2(topLeftY - topCenterY, leftX - topCenterX);
    const topEndAngle = Math.atan2(topRightY - topCenterY, rightX - topCenterX);

    // Create the clipping path that defines the visible tarp area
    ctx.beginPath();
    // Start at bottom left
    ctx.moveTo(0, bottomY);
    // Draw bottom arc (curving inward)
    ctx.arc(bottomCenterX, bottomCenterY, radius * SCALE, bottomStartAngle, bottomEndAngle, false);
    // Draw right edge up to top arc
    ctx.lineTo(canvasWidth, topRightY);
    // Draw top arc (curving inward)
    ctx.arc(topCenterX, topCenterY, topArcRadius, topEndAngle, topStartAngle, true);
    // Close path back to bottom left
    ctx.closePath();
  };

  // Function to draw straight red grid overlay
  const drawStraightGrid = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const gridSpacingFeet = 6;
    const gridSpacingInches = gridSpacingFeet * 12; // 72 inches
    const gridSpacingPixels = gridSpacingInches * SCALE;

    const horizontalOffsetFeet = 3;
    const horizontalOffsetInches = horizontalOffsetFeet * 12; // 36 inches
    const horizontalOffsetPixels = horizontalOffsetInches * SCALE;

    const lineWidthInches = 1;
    const lineWidthPixels = lineWidthInches * SCALE;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = lineWidthPixels;

    // Draw vertical lines (with 3-foot horizontal offset)
    for (let x = horizontalOffsetPixels; x <= canvasWidth; x += gridSpacingPixels) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Draw straight horizontal lines (no vertical offset, starts at 0)
    for (let y = 0; y <= canvasHeight; y += gridSpacingPixels) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  };

  // Function to draw grid labels (upside-down text at intersections)
  const drawGridLabels = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const gridSpacingFeet = 6;
    const gridSpacingInches = gridSpacingFeet * 12; // 72 inches
    const gridSpacingPixels = gridSpacingInches * SCALE;

    const horizontalOffsetFeet = 3;
    const horizontalOffsetInches = horizontalOffsetFeet * 12; // 36 inches
    const horizontalOffsetPixels = horizontalOffsetInches * SCALE;

    const fontSizeInches = 1; // 1 inch tall
    const fontSizePixels = fontSizeInches * SCALE;

    // Calculate arc parameters (same as edge masks)
    const arcDepthInches = CONFIG.arc.depthFeet * 12;
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    const baseCenterX = canvasWidth / 2;
    const baseCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;
    const arcRadius = radius * SCALE;

    ctx.fillStyle = 'white';
    ctx.font = `${fontSizePixels}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate total number of horizontal lines
    const totalHorizontalLines = Math.floor(canvasHeight / gridSpacingPixels) + 1;

    // Letters: A-J from bottom to top
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    // Calculate vertical line positions and their numbers
    const verticalLinePositions: { x: number; number: number }[] = [];
    let verticalIndex = 0;
    for (let x = horizontalOffsetPixels; x <= canvasWidth; x += gridSpacingPixels) {
      verticalLinePositions.push({ x, number: 0 }); // Will calculate numbers next
      verticalIndex++;
    }

    // Assign numbers: 15 at edges, 50 at center
    const centerIndex = Math.floor((verticalLinePositions.length - 1) / 2);
    for (let i = 0; i < verticalLinePositions.length; i++) {
      const distanceFromCenter = Math.abs(i - centerIndex);
      // Numbers go from 15 to 50: 15, 20, 25, 30, 35, 40, 45, 50
      // Distance 0 = 50, distance 1 = 45, distance 2 = 40, etc.
      const number = 50 - (distanceFromCenter * 5);
      verticalLinePositions[i].number = number;
    }

    // For each grid intersection point
    for (let i = 0; i * gridSpacingPixels <= canvasHeight; i++) {
      // Arc center for this horizontal line
      const arcCenterY = baseCenterY - (i * gridSpacingPixels);

      // Get letter for this row (top to bottom)
      const letter = letters[i] || ''; // Use empty string if we run out of letters

      for (let vIndex = 0; vIndex < verticalLinePositions.length; vIndex++) {
        const { x, number } = verticalLinePositions[vIndex];

        // Calculate the y-coordinate where this arc intersects the vertical line at x
        const dx = x - baseCenterX;
        const dySquared = arcRadius * arcRadius - dx * dx;

        if (dySquared >= 0) {
          const y = arcCenterY - Math.sqrt(dySquared);

          // Save context for rotation
          ctx.save();

          // Move to intersection point
          ctx.translate(x, y);

          // Rotate 180 degrees (upside down)
          ctx.rotate(Math.PI);

          // Draw letter in upper-right quadrant (which is lower-left in our rotated space)
          // Upper right = positive x, negative y in normal space
          // After 180° rotation, we need negative x, positive y
          const horizontalOffsetInches = 1.2; // 1.2 inches horizontal from center
          const verticalOffsetInches = 1.5; // 1.5 inches vertical from center
          const horizontalOffset = horizontalOffsetInches * SCALE;
          const verticalOffset = verticalOffsetInches * SCALE;
          ctx.fillText(letter, -horizontalOffset, verticalOffset);

          // Draw number in upper-left quadrant (which is lower-right in our rotated space)
          // Upper left = negative x, negative y in normal space
          // After 180° rotation, we need positive x, positive y
          ctx.fillText(number.toString(), horizontalOffset, verticalOffset);

          // Restore context
          ctx.restore();
        }
      }
    }
  };

  // Function to draw white intersection grid overlay (only at grid intersections)
  const drawWhiteIntersectionGrid = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const gridSpacingFeet = 6;
    const gridSpacingInches = gridSpacingFeet * 12; // 72 inches
    const gridSpacingPixels = gridSpacingInches * SCALE;

    const horizontalOffsetFeet = 3;
    const horizontalOffsetInches = horizontalOffsetFeet * 12; // 36 inches
    const horizontalOffsetPixels = horizontalOffsetInches * SCALE;

    const lineWidthInches = 0.75;
    const lineWidthPixels = lineWidthInches * SCALE;

    const intersectionSegmentInches = 2; // Length on each side of intersection
    const intersectionSegmentPixels = intersectionSegmentInches * SCALE;

    // Calculate arc parameters (same as edge masks)
    const arcDepthInches = CONFIG.arc.depthFeet * 12;
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidthPixels;

    const baseCenterX = canvasWidth / 2;
    const baseCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;
    const arcRadius = radius * SCALE;

    // For each grid intersection point
    for (let i = 0; i * gridSpacingPixels <= canvasHeight; i++) {
      // Arc center for this horizontal line
      const arcCenterY = baseCenterY - (i * gridSpacingPixels);

      for (let x = horizontalOffsetPixels; x <= canvasWidth; x += gridSpacingPixels) {
        // Calculate the y-coordinate where this arc intersects the vertical line at x
        const dx = x - baseCenterX;
        const dySquared = arcRadius * arcRadius - dx * dx;

        if (dySquared >= 0) {
          const y = arcCenterY - Math.sqrt(dySquared);

          // Draw vertical segment (straight line)
          ctx.beginPath();
          ctx.moveTo(x, y - intersectionSegmentPixels);
          ctx.lineTo(x, y + intersectionSegmentPixels);
          ctx.stroke();

          // Draw horizontal segment (arc segment)
          // We need to find two points on the arc that are intersectionSegmentPixels away (along the arc)
          // This is approximate - we'll use the arc length formula and work backwards

          // For a small arc segment, we can approximate the angle span
          // Arc length = radius * angle, so angle = arc length / radius
          const arcLengthSegment = intersectionSegmentPixels;
          const angleSpan = arcLengthSegment / arcRadius;

          // Current angle from center to intersection point
          const currentAngle = Math.atan2(y - arcCenterY, x - baseCenterX);

          // Start and end angles for the horizontal arc segment
          const startAngle = currentAngle - angleSpan;
          const endAngle = currentAngle + angleSpan;

          ctx.beginPath();
          ctx.arc(baseCenterX, arcCenterY, arcRadius, startAngle, endAngle, false);
          ctx.stroke();
        }
      }
    }
  };

  // Function to draw white grid overlay
  const drawGreenGrid = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const gridSpacingFeet = 6;
    const gridSpacingInches = gridSpacingFeet * 12; // 72 inches
    const gridSpacingPixels = gridSpacingInches * SCALE;

    const horizontalOffsetFeet = 3;
    const horizontalOffsetInches = horizontalOffsetFeet * 12; // 36 inches
    const horizontalOffsetPixels = horizontalOffsetInches * SCALE;

    const lineWidthInches = 1;
    const lineWidthPixels = lineWidthInches * SCALE;

    // Calculate arc parameters (same as edge masks)
    const arcDepthInches = CONFIG.arc.depthFeet * 12;
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    ctx.strokeStyle = 'green';
    ctx.lineWidth = lineWidthPixels;

    // Draw vertical lines (with 3-foot horizontal offset)
    for (let x = horizontalOffsetPixels; x <= canvasWidth; x += gridSpacingPixels) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Draw horizontal arc lines using the same arc radius, but shifting the center point up
    // This creates truly parallel arcs with consistent spacing everywhere
    const baseCenterX = canvasWidth / 2;
    const baseCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;

    // Use the same radius for all arcs (the radius of the bottom edge mask)
    const arcRadius = radius * SCALE;

    // Left edge: x = 0
    // Right edge: x = canvasWidth
    const leftX = 0;
    const rightX = canvasWidth;

    // Draw arcs by shifting the center point up by gridSpacingPixels for each line
    for (let i = 0; i * gridSpacingPixels <= canvasHeight; i++) {
      // Shift the center point upward
      const arcCenterX = baseCenterX;
      const arcCenterY = baseCenterY - (i * gridSpacingPixels);

      // Calculate where this arc intersects the left and right edges
      const leftDx = leftX - arcCenterX;
      const leftDySquared = arcRadius * arcRadius - leftDx * leftDx;

      const rightDx = rightX - arcCenterX;
      const rightDySquared = arcRadius * arcRadius - rightDx * rightDx;

      // Only draw if the arc intersects the canvas width
      if (leftDySquared >= 0 && rightDySquared >= 0) {
        // We want the upper intersection point (smaller y value, closer to top)
        const leftY = arcCenterY - Math.sqrt(leftDySquared);
        const rightY = arcCenterY - Math.sqrt(rightDySquared);

        // Calculate angles from center to these points
        const startAngle = Math.atan2(leftY - arcCenterY, leftX - arcCenterX);
        const endAngle = Math.atan2(rightY - arcCenterY, rightX - arcCenterX);

        // Draw the arc
        ctx.beginPath();
        ctx.arc(arcCenterX, arcCenterY, arcRadius, startAngle, endAngle, false);
        ctx.stroke();
      }
    }
  };

  // Function to draw multiple waves of ripples from top to bottom
  const drawMultipleRippleWaves = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const numWaves = CONFIG.wave.count;

    // Margins to keep all ripples within unmasked area (from CONFIG)
    const topMargin = CONFIG.wave.topMargin * SCALE;
    const bottomMargin = CONFIG.wave.bottomMargin * SCALE;

    for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
      const waveProgress = waveIndex / (numWaves - 1); // 0 to 1

      // Y position: spread from top margin to bottom margin
      const y = topMargin + (canvasHeight - topMargin - bottomMargin) * waveProgress;

      // Save the current context state
      ctx.save();

      // Translate to the Y position where we want to draw the wave
      ctx.translate(0, y - canvasHeight / 2);

      // Determine color and opacity based on wave index
      const middleWaveIndex = Math.floor(numWaves / 2);
      const isMiddleWave = waveIndex === middleWaveIndex;
      const distanceFromMiddle = Math.abs(waveIndex - middleWaveIndex);

      if (isMiddleWave) {
        // Middle wave: bright teal with higher opacity
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, CONFIG.colors.teal, { min: 0.6, max: 0.9 }, true);
      } else if (distanceFromMiddle === 1) {
        // Waves adjacent to center: dark teal with medium opacity
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, CONFIG.colors.blue, { min: 0.3, max: 0.4 }, false);
      } else {
        ;
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, CONFIG.colors.blue, { min: 0.1, max: 0.2 }, false);
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

    // Set canvas size based on tarp dimensions
    const width = TARP_WIDTH_INCHES * SCALE;   // 1,080 * SCALE pixels
    const height = TARP_HEIGHT_INCHES * SCALE; // 720 * SCALE pixels
    canvas.width = width;
    canvas.height = height;

    // Set up clipping path for the tarp shape (makes edges transparent)
    ctx.save();
    // createTarpClipPath(ctx, width, height);
    // ctx.clip();

    // Fill canvas with solid background color (only inside clipped area)
    ctx.fillStyle = CONFIG.colors.background;
    // ctx.fillStyle = "rgb(0, 0, 0)";
    // ctx.fillRect(0, 0, width, height);

    // Draw ripple layer (on top of morse code)
    drawRipplesLayer(ctx, width, height);

    // Draw grid overlay on top of everything
    // drawGreenGrid(ctx, width, height);

    // Draw white intersection grid
    // drawWhiteIntersectionGrid(ctx, width, height);

    // Draw grid labels (upside-down text)
    // drawGridLabels(ctx, width, height);

    // Restore context (removes clipping)
    ctx.restore();

    // Draw straight red grid overlay
    // drawStraightGrid(ctx, width, height);

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
    root.render(<TarpCanvas2026 />);
  }
});

export default TarpCanvas2026;
