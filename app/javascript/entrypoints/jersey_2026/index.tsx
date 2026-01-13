import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Scale factor: pixels per inch
const SCALE = 10;

// Configuration constants
const CONFIG = {
  ring: {
    maxLineWidth: 10, // Thickest line for innermost rings (in pixels at SCALE=1)
    minLineWidth: 1, // Thinnest line for outermost rings (in pixels at SCALE=1)
    radiusGrowth: 1.1, // Power factor for ring radius spacing
  },
  colors: {
    teal: '#02aaa2', // Bright teal for rings
    chartreuse: '#85e600', // Chartreuse green for the center ring
    pink: '#ec67f0', // Pink/magenta for the center ripple
    gold: '#dec573', // Gold for Greek key pattern
  },
  greekKey: {
    keySize: 25.6, // Size of each key unit in inches
  },
  weave: {
    warpThreads: {
      count: 150, // Fewer threads for jersey (smaller canvas)
      angle: 26.57, // Angle in degrees
      minLength: 36, // Minimum length in inches
      maxLength: 240, // Maximum length in inches
    },
    weftThreads: {
      count: 150, // Fewer threads for jersey
      angle: 153.43, // Complementary angle in degrees
      minLength: 36, // Minimum length in inches
      maxLength: 240, // Maximum length in inches
    },
    baseWidth: 2, // Base width in inches at center of thread
    opacity: 0.6, // Base opacity for threads
    seed: 54321, // Seed for reproducible randomness
    thicknessVariation: 0.2, // Thickness variation (0.8-1.2x)
  },
} as const;

// Seeded random number generator for reproducible patterns
const createSeededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

// Component for Greek Key pattern canvas
const GreekKeyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw a single Greek key unit
  const drawGreekKeyUnit = (
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    patternSize: number
  ) => {
    ctx.save();
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

  // Function to draw Greek key pattern
  const drawGreekKeyPattern = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    color: string,
    keySize: number
  ) => {
    const patternSize = keySize * SCALE;

    ctx.lineWidth = SCALE * 1.6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = color;

    let rowIndex = 0;
    let baseY = -patternSize * 1.71;
    while (baseY < height + 1) {
      // Offset every other row by half a pattern width
      const xOffset = (rowIndex % 2 === 1) ? patternSize / 2 : 0;
      let baseX = xOffset - patternSize; // Start one pattern to the left

      while (baseX < width + patternSize) {
        drawGreekKeyUnit(ctx, baseX, baseY, patternSize);
        baseX += patternSize;
      }

      baseY += patternSize * 7 / 8;
      rowIndex++;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for Greek key pattern (square canvas)
    const canvasSize = 300 * SCALE; // 300 inches square
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear background (transparent)
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw Greek key pattern
    drawGreekKeyPattern(
      ctx,
      canvasSize,
      canvasSize,
      CONFIG.colors.gold,
      CONFIG.greekKey.keySize
    );

    return () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#000', marginBottom: '10px' }}>Jersey 2026 - Greek Key Pattern</h2>
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

// Component for smaller ripple without highlighted center
const SmallRippleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw concentric rings without special center color
  const drawConcentricRings = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    minRadius: number,
    numRings: number,
    color: string
  ) => {
    // Parse color
    let r: number, g: number, b: number;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (!result) return;
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);

    for (let i = 0; i < numRings; i++) {
      const progress = i / (numRings - 1);

      // Calculate radius using power growth
      const radius = minRadius + (maxRadius - minRadius) * Math.pow(progress, CONFIG.ring.radiusGrowth);

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = CONFIG.ring.maxLineWidth * SCALE;
      const minLineWidth = CONFIG.ring.minLineWidth * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = 0.6;
      const minOpacity = 0.2;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Use same color for all rings
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for smaller ripple (square canvas)
    const canvasSize = 300 * SCALE; // 300 inches square
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear background (transparent)
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw smaller ripple at center
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const diameterFeet = 12; // Smaller ripple size (12 feet instead of 18)
    const diameterInches = diameterFeet * 12;
    const maxRadius = (diameterInches / 2) * SCALE;
    const minRadius = maxRadius / 8;
    const numRings = 5; // Fewer rings than the large ripple

    drawConcentricRings(
      ctx,
      centerX,
      centerY,
      maxRadius,
      minRadius,
      numRings,
      CONFIG.colors.teal
    );

    return () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#000', marginBottom: '10px' }}>Jersey 2026 - Small Ripple</h2>
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

// Component for extra small ripple
const ExtraSmallRippleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw concentric rings without special center color
  const drawConcentricRings = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    minRadius: number,
    numRings: number,
    color: string
  ) => {
    // Parse color
    let r: number, g: number, b: number;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (!result) return;
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);

    for (let i = 0; i < numRings; i++) {
      const progress = i / (numRings - 1);

      // Calculate radius using power growth
      const radius = minRadius + (maxRadius - minRadius) * Math.pow(progress, CONFIG.ring.radiusGrowth);

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = CONFIG.ring.maxLineWidth * SCALE;
      const minLineWidth = CONFIG.ring.minLineWidth * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = 0.5;
      const minOpacity = 0.15;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Use same color for all rings
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for extra small ripple (square canvas)
    const canvasSize = 300 * SCALE; // 300 inches square
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear background (transparent)
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw extra small ripple at center
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const diameterFeet = 9; // Even smaller ripple size (9 feet)
    const diameterInches = diameterFeet * 12;
    const maxRadius = (diameterInches / 2) * SCALE;
    const minRadius = maxRadius / 8;
    const numRings = 4; // Even fewer rings

    drawConcentricRings(
      ctx,
      centerX,
      centerY,
      maxRadius,
      minRadius,
      numRings,
      CONFIG.colors.teal
    );

    return () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#000', marginBottom: '10px' }}>Jersey 2026 - Extra Small Ripple</h2>
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

// Component for woven thread texture
const WeaveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Function to draw woven thread texture
  const drawWeave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const random = createSeededRandom(CONFIG.weave.seed);

    const warpAngleRad = (CONFIG.weave.warpThreads.angle * Math.PI) / 180;
    const weftAngleRad = (CONFIG.weave.weftThreads.angle * Math.PI) / 180;

    // Generate warp thread positions
    const warpThreads: Array<{ x: number; y: number; length: number }> = [];

    for (let i = 0; i < CONFIG.weave.warpThreads.count; i++) {
      const x = random() * width * 1.2 - width * 0.1;
      const y = random() * height * 1.2 - height * 0.1;

      const lengthInches = CONFIG.weave.warpThreads.minLength +
        random() * (CONFIG.weave.warpThreads.maxLength - CONFIG.weave.warpThreads.minLength);
      const length = lengthInches * SCALE;

      warpThreads.push({ x, y, length });
    }

    // Generate weft thread positions
    const weftThreads: Array<{ x: number; y: number; length: number }> = [];

    for (let i = 0; i < CONFIG.weave.weftThreads.count; i++) {
      const x = random() * width * 1.2 - width * 0.1;
      const y = random() * height * 1.2 - height * 0.1;

      const lengthInches = CONFIG.weave.weftThreads.minLength +
        random() * (CONFIG.weave.weftThreads.maxLength - CONFIG.weave.weftThreads.minLength);
      const length = lengthInches * SCALE;

      weftThreads.push({ x, y, length });
    }

    ctx.fillStyle = '#000000'; // Black threads
    ctx.globalAlpha = CONFIG.weave.opacity;

    // Draw warp threads
    for (const warp of warpThreads) {
      const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.thicknessVariation;
      const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

      drawThread(ctx, warp.x, warp.y, warp.length, warpAngleRad, threadWidth);
    }

    // Draw weft threads
    for (const weft of weftThreads) {
      const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.thicknessVariation;
      const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

      drawThread(ctx, weft.x, weft.y, weft.length, weftAngleRad, threadWidth);
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for weave pattern
    const canvasSize = 300 * SCALE; // 300 inches square
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear background (transparent)
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw weave pattern
    drawWeave(ctx, canvasSize, canvasSize);

    return () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#000', marginBottom: '10px' }}>Jersey 2026 - Woven Texture</h2>
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

const JerseyCanvas2026: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw concentric rings with chartreuse center
  const drawConcentricRings = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    maxRadius: number,
    minRadius: number,
    numRings: number,
    baseColor: string,
    centerColor: string
  ) => {
    // Parse base color
    let baseR: number, baseG: number, baseB: number;
    const baseResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
    if (!baseResult) return;
    baseR = parseInt(baseResult[1], 16);
    baseG = parseInt(baseResult[2], 16);
    baseB = parseInt(baseResult[3], 16);

    // Parse center color (chartreuse)
    let centerR: number, centerG: number, centerB: number;
    const centerResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(centerColor);
    if (!centerResult) return;
    centerR = parseInt(centerResult[1], 16);
    centerG = parseInt(centerResult[2], 16);
    centerB = parseInt(centerResult[3], 16);

    for (let i = 0; i < numRings; i++) {
      const progress = i / (numRings - 1);

      // Calculate radius using power growth
      const radius = minRadius + (maxRadius - minRadius) * Math.pow(progress, CONFIG.ring.radiusGrowth);

      // Calculate line width - thicker inner rings, thinner outer rings
      const maxLineWidth = CONFIG.ring.maxLineWidth * SCALE;
      const minLineWidth = CONFIG.ring.minLineWidth * SCALE;
      const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

      // Calculate opacity - more opaque inner rings, less opaque outer rings
      const maxOpacity = 0.9;
      const minOpacity = 0.3;
      const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

      // Use chartreuse for innermost ring, base color for others
      if (i === 0) {
        ctx.strokeStyle = `rgba(${centerR}, ${centerG}, ${centerB}, ${opacity})`;
      } else {
        ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${opacity})`;
      }

      ctx.lineWidth = lineWidth;

      // Draw the ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for single ripple (square canvas)
    const canvasSize = 300 * SCALE; // 300 inches square
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear background (transparent)
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw single ripple at center
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const diameterFeet = 18; // Outermost ripple size
    const diameterInches = diameterFeet * 12;
    const maxRadius = (diameterInches / 2) * SCALE;
    const minRadius = maxRadius / 8;
    const numRings = 7;

    drawConcentricRings(
      ctx,
      centerX,
      centerY,
      maxRadius,
      minRadius,
      numRings,
      CONFIG.colors.teal,
      CONFIG.colors.pink
    );

    return () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <h2 style={{ color: '#000', marginBottom: '10px' }}>Jersey 2026 - Ripple Design</h2>
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

// Main app component that renders all canvases
const App: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '20px' }}>
      <JerseyCanvas2026 />
      <SmallRippleCanvas />
      <ExtraSmallRippleCanvas />
      <GreekKeyCanvas />
      <WeaveCanvas />
    </div>
  );
};

// Mount the component to the DOM
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});

export default App;
