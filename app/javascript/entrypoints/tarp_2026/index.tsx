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
}

const TarpCanvas2026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tarp dimensions in feet
  const TARP_WIDTH_FEET = 90;
  const TARP_HEIGHT_FEET = 60;

  // Convert to inches (base unit: 1 pixel = 1 inch at SCALE = 1)
  const TARP_WIDTH_INCHES = TARP_WIDTH_FEET * 12;  // 1,080 inches
  const TARP_HEIGHT_INCHES = TARP_HEIGHT_FEET * 12; // 720 inches

  // Scale factor: pixels per inch
  // SCALE = 1: 1,080 × 720 px (1 pixel per inch, print-ready)
  // SCALE = 10: 10,800 × 7,200 px (10 pixels per inch, high-res)
  const SCALE = 1;

  // Function to draw a single wave of ripples with a specific color
  const drawRippleWaveWithColor = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, color: string, opacityRange?: { min: number; max: number }, isCenterWave?: boolean) => {
    const numRipples = 7;
    const edgeMargin = 120 * SCALE; // Horizontal distance from edge for outer ripples

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
      const waveAmplitude = 50 * SCALE; // Height of the wave
      const wavePhase = progress * 2 * Math.PI; // Creates wave from 0 to 2π (full cycle)
      const baseY = canvasHeight / 2;
      const y = baseY + Math.sin(wavePhase) * waveAmplitude;

      // Calculate distance from center ripple (index 3 is center)
      const centerIndex = Math.floor(numRipples / 2); // 3
      const distanceFromCenter = Math.abs(i - centerIndex); // 0, 1, 2, or 3

      // Define ripple diameters in feet based on distance from center
      const rippleDiameters: { [key: number]: number } = {
        0: 9,   // center ripples: 6 feet diameter
        1: 12,  // next out: 10 feet diameter
        2: 15,  // next out: 14 feet diameter
        3: 18   // outermost: 18 feet diameter
      };

      // Define number of concentric rings based on distance from center
      const numRingsMap: { [key: number]: number } = {
        0: 4,   // center ripples: 3 rings
        1: 5,   // next out: 5 rings
        2: 6,   // next out: 6 rings
        3: 7    // outermost: 7 rings
      };

      const diameterFeet = rippleDiameters[distanceFromCenter];
      const diameterInches = diameterFeet * 12;
      const maxRadius = (diameterInches / 2) * SCALE; // Convert diameter to radius in pixels
      const minRadius = maxRadius / 8; // Inner radius is 1/8 of outer radius
      const numRings = numRingsMap[distanceFromCenter];

      // Opacity: more opaque at edges, less opaque at center
      const opacityProgress = distanceFromCenter / 3; // 0 at center, 1 at edges
      const baseOpacity = opacityRange
        ? opacityRange.min + (opacityRange.max - opacityRange.min) * opacityProgress
        : 0.3 + (0.2 * opacityProgress); // 0.5 at edges, 0.3 at center

      // Check if this is the 4th ripple (index 3) in the center wave
      const isCenterRipple = isCenterWave && i === 3; // 4th ripple (0-indexed)

      drawConcentricRingsWithColor(ctx, {
        centerX: x,
        centerY: y,
        maxRadius,
        minRadius,
        baseOpacity,
        color,
        numRings
      }, isCenterRipple);
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
    const morseText = morseCode.split('').map(char => morseMap[char.toUpperCase()] || char).join(' ');

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
    for (let i = 0; i < config.numRings; i++) {
      // Calculate radius - inner rings closer together, outer rings more spaced
      const progress = i / (config.numRings - 1);

      // More gradual growth options:
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * progress * progress; // Quadratic (current)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * progress; // Linear (even spacing)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.5); // Power 1.5 (between linear and quadratic)
      // const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.3); // Power 1.3 (more gradual than quadratic)
      const radius = config.minRadius + (config.maxRadius - config.minRadius) * Math.pow(progress, 1.1); // Power 1.1 (more gradual than quadratic)

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = 10 * SCALE; // Reduced for thinner innermost circles
      const minLineWidth = 1 * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = config.baseOpacity;
      const minOpacity = 0.1;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Draw normal ring
      ctx.strokeStyle = config.color.replace('1)', `${opacity})`);
      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(config.centerX, config.centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // Function to draw second layer content (rendered on top of base layer, below masks)
  const drawSecondLayer = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
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
    const morseMap: { [key: string]: string } = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.',
      'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.',
      'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-',
      'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '?': '..--..'
    };

    // Convert text to morse code
    const morseText = text.split('').map(char => morseMap[char.toUpperCase()] || char).join(' ');

    // Morse code symbol dimensions (in inches at SCALE=1)
    const baseDotSize = 6; // Radius for dots
    const baseDashWidth = 15; // Width for dashes
    const baseDashHeight = 12; // Height for dashes
    const baseSymbolSpacing = 15; // Space between symbols
    const baseLetterSpacing = 15; // Space between letters

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

    // Calculate available arc length and center the text
    const totalAngle = endAngle - startAngle;
    const arcLength = radius * totalAngle;
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

  // Function to draw third layer content (morse code along top and bottom arcs)
  const drawThirdLayer = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const arcDepthInches = 6 * 12; // 6 feet = 72 inches
    const insetInches = 18; // How far to inset the morse code from the edge

    // Calculate arc parameters (same as mask)
    const width = TARP_WIDTH_INCHES;
    const depth = arcDepthInches;
    const radius = (width * width + 4 * depth * depth) / (8 * depth);

    const tealColor = 'rgba(0, 255, 200, 0.9)';
    const text = 'CAN YOU HEAR ME?';

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

    drawMorseCodeAlongArc(ctx, text, bottomCenterX, bottomCenterY, bottomRadius, bottomStartAngle, bottomEndAngle, tealColor);

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

    drawMorseCodeAlongArc(ctx, text, topCenterX, topCenterY, topRadius, topStartAngle, topEndAngle, tealColor);
  };

  // Function to draw edge masks that simulate the curved tarp edges
  const drawEdgeMasks = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const arcDepthInches = 6 * 12; // 6 feet = 72 inches

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
    const numWaves = 5;

    // Margins to keep all ripples within unmasked area (in inches)
    // Adjust these values independently to balance visual spacing
    const topMargin = 160;
    const bottomMargin = 190;

    for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
      const waveProgress = waveIndex / (numWaves - 1); // 0 to 1

      // Y position: spread from top margin to bottom margin
      const y = topMargin + (canvasHeight - topMargin - bottomMargin) * waveProgress;

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

    // Set canvas size based on tarp dimensions
    const width = TARP_WIDTH_INCHES * SCALE;   // 1,080 * SCALE pixels
    const height = TARP_HEIGHT_INCHES * SCALE; // 720 * SCALE pixels
    canvas.width = width;
    canvas.height = height;

    // Fill canvas with blue background
    ctx.fillStyle = '#0a1f4e';
    ctx.fillRect(0, 0, width, height);

    // Draw second layer (overlays on top of base layer)
    drawSecondLayer(ctx, width, height);

    // Draw third layer (morse code along edges)
    drawThirdLayer(ctx, width, height);

    // Draw edge masks to simulate the curved tarp edges
    drawEdgeMasks(ctx, width, height);
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
