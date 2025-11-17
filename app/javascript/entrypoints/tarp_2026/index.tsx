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
const SCALE = 25;

// Morse code mapping for text conversion
const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.',
  'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.',
  'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-',
  'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '?': '..--..'
};

// Configuration constants
const CONFIG = {
  // Ripple wave configuration
  ripple: {
    numRipplesPerWave: 7,
    edgeMargin: 120, // Horizontal distance from edge for outer ripples (in inches at SCALE=1)
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
    topMargin: 160, // Distance from top edge (in inches)
    bottomMargin: 190, // Distance from bottom edge (in inches)
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
    background: '#061f37', // Dark blue-gray for edges
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
      const x = edgeMargin + (canvasWidth - 2 * edgeMargin) * horizontalProgress;

      // Y position: wave pattern with peak on left, trough on right
      const waveAmplitude = CONFIG.ripple.waveAmplitude * SCALE;
      const wavePhase = progress * 2 * Math.PI; // Creates wave from 0 to 2π (full cycle)
      const baseY = canvasHeight / 2;
      const y = baseY + Math.sin(wavePhase) * waveAmplitude;

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

  // Function to draw morse code along an arc path
  const drawMorseCodeAlongArc = (
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string
  ) => {
    // Convert text to morse code
    const morseText = text.split('').map(char => MORSE_MAP[char.toUpperCase()] || char).join(' ');

    // Morse code symbol dimensions (from CONFIG)
    const baseDotSize = CONFIG.morse.dotSize;
    const baseDashWidth = CONFIG.morse.dashWidth;
    const baseDashHeight = CONFIG.morse.dashHeight;
    const baseSymbolSpacing = CONFIG.morse.symbolSpacing;
    const baseLetterSpacing = CONFIG.morse.letterSpacing;

    // Apply scale
    const dotSize = baseDotSize * SCALE;
    const dashWidth = baseDashWidth * SCALE;
    const dashHeight = baseDashHeight * SCALE;
    const symbolSpacing = baseSymbolSpacing * SCALE;
    const letterSpacing = baseLetterSpacing * SCALE;

    // Calculate total angular span needed
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

    // Calculate available arc angle and center the text
    const totalAngle = endAngle - startAngle;
    const totalWidthScaled = totalWidth * SCALE;

    // Start angle centered on the arc
    let currentAngle = startAngle + (totalAngle - (totalWidthScaled / radius)) / 2;

    ctx.save();
    ctx.fillStyle = color;

    for (let i = 0; i < morseText.length; i++) {
      const char = morseText[i];
      const x = centerX + Math.cos(currentAngle) * radius;
      const y = centerY + Math.sin(currentAngle) * radius;

      // Calculate rotation angle perpendicular to the arc
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
        const capRadius = halfHeight;

        ctx.beginPath();
        ctx.arc(-halfWidth, 0, capRadius, Math.PI / 2, -Math.PI / 2, false);
        ctx.lineTo(halfWidth, -halfHeight);
        ctx.arc(halfWidth, 0, capRadius, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(-halfWidth, halfHeight);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Move to next position
      if (i < morseText.length - 1) {
        let spacing = 0;
        if (char === ' ') {
          spacing = letterSpacing;
        } else if (char === '.') {
          spacing = (dotSize * 2) + symbolSpacing;
        } else if (char === '-') {
          spacing = dashWidth + symbolSpacing;
        }
        currentAngle += spacing / radius;
      }
    }

    ctx.restore();
  };

  // Function to draw morse code layer (rendered on top of gradient, below ripples)
  const drawMorseCodeLayer = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const arcDepthInches = CONFIG.arc.depthFeet * 12; // Convert feet to inches
    const insetInches = CONFIG.arc.morseInsetInches;

    // Calculate arc parameters (same as mask)
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    const morseColor = CONFIG.colors.backgroundCenter;

    // Bottom arc morse code
    // Circle center is BELOW the canvas, so to move inward we INCREASE radius
    const bottomCenterX = canvasWidth / 2;
    const bottomCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;
    const bottomRadius = (radius + insetInches) * SCALE; // Inset radius (larger moves arc UP toward center)

    // Calculate angle range for bottom arc
    const bottomY = TARP_HEIGHT_INCHES * SCALE;
    const fullBottomStartAngle = Math.atan2(bottomY - bottomCenterY, 0 - bottomCenterX);
    const fullBottomEndAngle = Math.atan2(bottomY - bottomCenterY, canvasWidth - bottomCenterX);
    const bottomAngleSpan = fullBottomEndAngle - fullBottomStartAngle;
    const bottomStartAngle = fullBottomStartAngle + bottomAngleSpan * 0.1;
    const bottomEndAngle = fullBottomEndAngle - bottomAngleSpan * 0.1;

    // drawMorseCodeAlongArc(ctx, CONFIG.morse.bottomText, bottomCenterX, bottomCenterY, bottomRadius, bottomStartAngle, bottomEndAngle, morseColor);

    // Top arc morse code
    // Circle center is ABOVE the canvas, so to move inward we DECREASE radius
    const topCenterX = canvasWidth / 2;
    const topCenterY = radius * SCALE;
    const topRadius = (radius - insetInches) * SCALE; // Inset radius (smaller moves arc DOWN toward center)

    // Calculate angle range for top arc
    const cornerY = arcDepthInches * SCALE;
    const fullTopStartAngle = Math.atan2(cornerY - topCenterY, 0 - topCenterX);
    const fullTopEndAngle = Math.atan2(cornerY - topCenterY, canvasWidth - topCenterX);
    const topAngleSpan = fullTopEndAngle - fullTopStartAngle;
    const topStartAngle = fullTopStartAngle + topAngleSpan * 0.1;
    const topEndAngle = fullTopEndAngle - topAngleSpan * 0.1;

    // drawMorseCodeAlongArc(ctx, CONFIG.morse.topText, topCenterX, topCenterY, topRadius, topStartAngle, topEndAngle, morseColor);
  };

  // Function to draw edge masks that simulate the curved tarp edges
  const drawEdgeMasks = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const arcDepthInches = CONFIG.arc.depthFeet * 12; // Convert feet to inches

    // Calculate circular arc parameters
    // For an arc spanning width W with depth D:
    // radius = (W^2 + 4*D^2) / (8*D)
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    ctx.fillStyle = 'black';

    // Bottom arc mask
    // Arc goes from (0, 720) curving up to (540, 648) and back to (1080, 720)
    // Center of circle is at (width/2, 720 + radius - depth)
    const bottomCenterX = (canvasWidth / 2);
    const bottomCenterY = (TARP_HEIGHT_INCHES + radius - depth) * SCALE;
    const bottomY = TARP_HEIGHT_INCHES * SCALE;

    // Calculate angles for the arc
    const bottomStartAngle = Math.atan2(bottomY - bottomCenterY, 0 - bottomCenterX);
    const bottomEndAngle = Math.atan2(bottomY - bottomCenterY, canvasWidth - bottomCenterX);

    ctx.beginPath();
    ctx.moveTo(0, bottomY);
    ctx.lineTo(canvasWidth, bottomY);
    // Arc back counterclockwise from right to left (going through the area outside canvas)
    ctx.arc(bottomCenterX, bottomCenterY, radius * SCALE, bottomEndAngle, bottomStartAngle, true);
    ctx.closePath();
    ctx.fill();

    // Top arc mask
    // Arc goes from (0, 72) curving up to (540, 0) and back to (1080, 72)
    // For this upward-curving arc, the circle center is BELOW the arc points
    // Calculate: if distance from (540, y_c) to (540, 0) = radius, then y_c = radius
    const topCenterX = (canvasWidth / 2);
    const topCenterY = radius * SCALE; // Center is below the canvas
    const topY = 0;
    const cornerY = arcDepthInches * SCALE;

    // Calculate angles for the arc (measuring from center to points)
    const topStartAngle = Math.atan2(cornerY - topCenterY, 0 - topCenterX);
    const topEndAngle = Math.atan2(cornerY - topCenterY, canvasWidth - topCenterX);

    ctx.beginPath();
    ctx.moveTo(0, cornerY); // Start at left corner (0, 72")
    ctx.arc(topCenterX, topCenterY, radius * SCALE, topStartAngle, topEndAngle, false);
    ctx.lineTo(canvasWidth, topY); // Go to top-right corner
    ctx.lineTo(0, topY); // Go to top-left corner
    ctx.closePath();
    ctx.fill();
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
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, CONFIG.colors.teal, { min: 0.5, max: 0.8 }, true);
      } else {
        // Other waves: dark teal with opacity based on distance from center
        // Distance 1 (waves adjacent to center): slightly more transparent
        // Distance 2 (outermost waves): even more transparent
        let opacityRange;
        if (distanceFromMiddle === 1) {
          // Adjacent waves: moderate transparency
          opacityRange = { min: 0.35, max: 0.55 };
        } else {
          // Outermost waves: high transparency
          opacityRange = { min: 0.15, max: 0.25 };
        }
        drawRippleWaveWithColor(ctx, canvasWidth, canvasHeight, CONFIG.colors.blue, opacityRange, false);
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

    // Fill canvas with radial gradient background (darker at edges, brighter at center)
    const centerX = width / 2;
    const centerY = height / 2;
    const gradientRadius = Math.sqrt(centerX * centerX + centerY * centerY); // Diagonal distance to corner

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradientRadius);
    gradient.addColorStop(0, CONFIG.colors.backgroundCenter); // Bright at center
    gradient.addColorStop(0.6, CONFIG.colors.background); // Transition to dark quickly
    gradient.addColorStop(1, CONFIG.colors.background); // Dark at edges

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw morse code layer (below ripples)
    drawMorseCodeLayer(ctx, width, height);

    // Draw ripple layer (on top of morse code)
    drawRipplesLayer(ctx, width, height);

    // Draw edge masks to simulate the curved tarp edges
    drawEdgeMasks(ctx, width, height);

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
