// Stage props drawing functions for tarp_2026

export const CONFIG_COLORS = {
  background: '#08263d',
  teal: '#02aaa2',
  blue: '#007a6e',
  outsideRippleCenterRing: '#85e600',
  centerRippleInnerRing: '#ec67f0',
} as const;

// Seeded random number generator
const createSeededRandom = (seed: number) => {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
};

// Function to draw concentric rings (ripple effect)
const drawConcentricRings = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  minRadius: number,
  numRings: number,
  color: string,
  baseOpacity: number,
  scale: number
) => {
  // Parse color
  let baseR: number, baseG: number, baseB: number;
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (result) {
    baseR = parseInt(result[1], 16);
    baseG = parseInt(result[2], 16);
    baseB = parseInt(result[3], 16);
  } else {
    return;
  }

  for (let i = 0; i < numRings; i++) {
    const progress = i / (numRings - 1);
    const radius = minRadius + (maxRadius - minRadius) * Math.pow(progress, 1.1);

    const maxLineWidth = 10 * scale;
    const minLineWidth = 1 * scale;
    const lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * progress;

    const maxOpacity = baseOpacity;
    const minOpacity = 0.1;
    const opacity = maxOpacity - (maxOpacity - minOpacity) * progress;

    ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${opacity})`;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

// Function to draw a single small stage segment (90°, 6'-12' diameter)
export const drawSmallStageSegment = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number
) => {
  const innerDiameter = 6 * 12; // 6 feet in inches
  const outerDiameter = 12 * 12; // 12 feet in inches
  const segmentAngle = Math.PI / 2; // 90 degrees

  const innerRadius = (innerDiameter / 2) * scale;
  const outerRadius = (outerDiameter / 2) * scale;

  const startAngle = -segmentAngle / 2;
  const endAngle = segmentAngle / 2;

  // Draw the arc segment
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
  ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
  ctx.closePath();

  ctx.fillStyle = CONFIG_COLORS.outsideRippleCenterRing;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
};

// Function to draw a single large stage segment (45°, 12'-18' diameter)
export const drawLargeStageSegment = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number
) => {
  const innerDiameter = 12 * 12; // 12 feet in inches
  const outerDiameter = 18 * 12; // 18 feet in inches
  const segmentAngle = Math.PI / 4; // 45 degrees

  const innerRadius = (innerDiameter / 2) * scale;
  const outerRadius = (outerDiameter / 2) * scale;

  const startAngle = -segmentAngle / 2;
  const endAngle = segmentAngle / 2;

  // Draw the arc segment
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
  ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
  ctx.closePath();

  ctx.fillStyle = CONFIG_COLORS.blue;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();
};

// Function to draw the assembled stage props (both rings)
export const drawStageProps = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Stage dimensions (using smaller scale for diagram)
  const diagramScale = 10; // 10 pixels per inch for the diagram
  const maxDiameter = 18 * 12; // 18 feet = 216 inches (outer diameter of large ring)
  const padding = 2 * 12; // 2 feet padding around the rings

  const canvasSize = (maxDiameter + 2 * padding) * diagramScale;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // Clear canvas
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Fill background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  // Small ring dimensions (inner ring)
  const smallInnerRadius = (6 * 12 / 2) * diagramScale; // 3 feet radius
  const smallOuterRadius = (12 * 12 / 2) * diagramScale; // 6 feet radius
  const smallSegmentAngle = Math.PI / 2; // 90 degrees in radians
  const smallNumSegments = 4;

  // Large ring dimensions (outer ring)
  const largeInnerRadius = (12 * 12 / 2) * diagramScale; // 6 feet radius
  const largeOuterRadius = (18 * 12 / 2) * diagramScale; // 9 feet radius
  const largeSegmentAngle = Math.PI / 4; // 45 degrees in radians
  const largeNumSegments = 8;

  // Draw large ring segments (outer ring)
  for (let i = 0; i < largeNumSegments; i++) {
    const startAngle = i * largeSegmentAngle;
    const endAngle = (i + 1) * largeSegmentAngle;

    // Draw the arc segment
    ctx.beginPath();
    ctx.arc(centerX, centerY, largeOuterRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, largeInnerRadius, endAngle, startAngle, true);
    ctx.closePath();

    // Alternate colors for visual clarity
    ctx.fillStyle = i % 2 === 0 ? CONFIG_COLORS.blue : CONFIG_COLORS.teal;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add segment number label
    const labelAngle = startAngle + largeSegmentAngle / 2;
    const labelRadius = (largeInnerRadius + largeOuterRadius) / 2;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`L${i + 1}`, labelX, labelY);
  }

  // Draw small ring segments (inner ring)
  for (let i = 0; i < smallNumSegments; i++) {
    const startAngle = i * smallSegmentAngle;
    const endAngle = (i + 1) * smallSegmentAngle;

    // Draw the arc segment
    ctx.beginPath();
    ctx.arc(centerX, centerY, smallOuterRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, smallInnerRadius, endAngle, startAngle, true);
    ctx.closePath();

    // All segments are chartreuse
    ctx.fillStyle = CONFIG_COLORS.outsideRippleCenterRing;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add segment number label
    const labelAngle = startAngle + smallSegmentAngle / 2;
    const labelRadius = (smallInnerRadius + smallOuterRadius) / 2;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;

    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`S${i + 1}`, labelX, labelY);
  }

  // Add dimension labels
  ctx.fillStyle = '#333';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';

  // Small ring label
  ctx.fillText('Small Ring: 6\' - 12\' (4 segments × 90°)', centerX, canvasSize - 20);

  // Large ring label
  ctx.fillText('Large Ring: 12\' - 18\' (8 segments × 45°)', centerX, canvasSize - 5);
};

// Function to draw vinyl strip calculation visualization
export const drawVinylCalculation = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const diagramScale = 12; // Scale for detail
  const padding = 4 * 12; // 4 feet padding

  // Calculate required canvas size based on the largest segment
  // Small ring: 90 degrees, outer radius = 6 feet
  // Large ring: 45 degrees, outer radius = 9 feet
  const largeOuterRadius = 9 * 12; // 9 feet in inches

  // Each segment gets its own square area
  const segmentAreaSize = (largeOuterRadius * 2) + (2 * 12); // diameter + 2 feet padding per segment
  const canvasWidth = segmentAreaSize * 2 + padding; // Two segments side by side plus center padding
  const canvasHeight = segmentAreaSize + (2 * 12); // Height to fit largest segment + padding

  canvas.width = canvasWidth * diagramScale;
  canvas.height = canvasHeight * diagramScale;

  // Clear background (transparent)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw small ring segment (90 degrees) - centered in left half
  const smallCenterX = (segmentAreaSize / 2) * diagramScale;
  const smallCenterY = canvas.height / 2;
  drawSegmentWithVinylLines(ctx, smallCenterX, smallCenterY, 6 * 12, 12 * 12, Math.PI / 2, diagramScale, 'Small Ring Segment (90°)', true);

  // Draw large ring segment (45 degrees) - centered in right half
  const largeCenterX = (segmentAreaSize + padding + segmentAreaSize / 2) * diagramScale;
  const largeCenterY = canvas.height / 2;
  drawSegmentWithVinylLines(ctx, largeCenterX, largeCenterY, 12 * 12, 18 * 12, Math.PI / 4, diagramScale, 'Large Ring Segment (45°)', false);
};

// Helper function to draw a single segment with vinyl calculation lines
const drawSegmentWithVinylLines = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerDiameter: number,
  outerDiameter: number,
  segmentAngle: number,
  scale: number,
  label: string,
  isSmall: boolean
) => {
  const innerRadius = (innerDiameter / 2) * scale;
  const outerRadius = (outerDiameter / 2) * scale;

  // Draw the segment centered at 0 degrees (pointing right)
  const startAngle = -segmentAngle / 2;
  const endAngle = segmentAngle / 2;

  // Calculate points on the inner arc at the segment angles (these are the inner chord endpoints)
  const innerChordPoint1X = centerX + Math.cos(startAngle) * innerRadius;
  const innerChordPoint1Y = centerY + Math.sin(startAngle) * innerRadius;
  const innerChordPoint2X = centerX + Math.cos(endAngle) * innerRadius;
  const innerChordPoint2Y = centerY + Math.sin(endAngle) * innerRadius;

  // Calculate points on the outer arc at the same segment angles
  const outerArcPoint1X = centerX + Math.cos(startAngle) * outerRadius;
  const outerArcPoint1Y = centerY + Math.sin(startAngle) * outerRadius;
  const outerArcPoint2X = centerX + Math.cos(endAngle) * outerRadius;
  const outerArcPoint2Y = centerY + Math.sin(endAngle) * outerRadius;

  // Calculate the outer chord properties
  const outerChordLength = Math.sqrt(Math.pow(outerArcPoint2X - outerArcPoint1X, 2) + Math.pow(outerArcPoint2Y - outerArcPoint1Y, 2));

  // For the rectangle, we want:
  // - Inner edge: the inner chord
  // - Outer edge: a parallel line at the same X positions as inner chord, but at Y positions of outer arc endpoints
  // This creates a rectangle that fully contains the segment

  // The rectangle corners are:
  // Inner: actual inner arc points at the segment angles
  const innerPoint1X = innerChordPoint1X;
  const innerPoint1Y = innerChordPoint1Y;

  // Outer: same X as inner points, but Y from outer arc points
  const outerPoint1Y = outerArcPoint1Y;
  const outerPoint2Y = outerArcPoint2Y;
  const outerArcX = centerX + outerRadius

  // Calculate vinyl width as the perpendicular distance between inner and outer chords
  // This is the distance from one corner to the opposite edge
  // For the rectangle: width from (innerPoint1X, innerPoint1Y) to (outerArcX, outerPoint1Y)
  const vinylWidthPixels = outerArcX - innerPoint1X;

  const chordLength = outerChordLength;

  // Draw the arc segment with tarp background fill (no outline)
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
  ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
  ctx.closePath();

  // Fill with tarp background color (no stroke)
  ctx.fillStyle = CONFIG_COLORS.background;
  ctx.fill();

  // For large segments, add 4 background ripples with seeded random positioning
  if (!isSmall) {
    const random = createSeededRandom(19);

    // Set up clipping to only draw ripples within the segment
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.clip();

    ctx.restore();
  }

  // Calculate and display dimensions
  const chordLengthInches = chordLength / scale;
  const vinylWidthInches = vinylWidthPixels / scale;

  // Draw labels
  ctx.fillStyle = '#000';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, centerX, centerY - outerRadius - 40);

  // Display calculated dimensions
  ctx.font = '16px sans-serif';
  ctx.fillText(`Vinyl Length: ${chordLengthInches.toFixed(2)}"`, centerX, centerY - outerRadius - 20);
  ctx.fillText(`Vinyl Width: ${vinylWidthInches.toFixed(2)}"`, centerX, centerY + outerRadius + 30);
};

// Function to draw vinyl layout - all segments laid out on a 50" wide vinyl strip
export const drawVinylLayout = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const VINYL_WIDTH_INCHES = 50;
  const scale = 25; // 25 pixels per inch for the layout view

  // Small ring: 4 segments × 90°, inner: 6', outer: 12'
  const smallSegments = {
    count: 4,
    innerDiameter: 6 * 12, // inches
    outerDiameter: 12 * 12, // inches
    segmentAngle: Math.PI / 2, // 90 degrees
    color: CONFIG_COLORS.outsideRippleCenterRing,
  };

  // Large ring: 8 segments × 45°, inner: 12', outer: 18'
  const largeSegments = {
    count: 8,
    innerDiameter: 12 * 12, // inches
    outerDiameter: 18 * 12, // inches
    segmentAngle: Math.PI / 4, // 45 degrees
    color: CONFIG_COLORS.blue,
  };

  // Calculate dimensions for each segment type
  const calculateSegmentDimensions = (innerDiameter: number, outerDiameter: number, segmentAngle: number) => {
    const innerRadius = innerDiameter / 2;
    const outerRadius = outerDiameter / 2;

    // Calculate chord length (length of vinyl strip)
    const innerChordLength = 2 * innerRadius * Math.sin(segmentAngle / 2);
    const outerChordLength = 2 * outerRadius * Math.sin(segmentAngle / 2);

    // Width is from inner chord to outermost point
    const width = outerRadius - innerRadius * Math.cos(segmentAngle / 2);

    return {
      length: outerChordLength,
      width: width,
    };
  };

  const smallDims = calculateSegmentDimensions(smallSegments.innerDiameter, smallSegments.outerDiameter, smallSegments.segmentAngle);
  const largeDims = calculateSegmentDimensions(largeSegments.innerDiameter, largeSegments.outerDiameter, largeSegments.segmentAngle);

  // Layout segments with specific spacing
  let currentY = 0;
  const segments: Array<{ x: number; y: number; length: number; width: number; color: string; label: string }> = [];

  // Small segments: 101.82" length with 1.18" spacing = 103" per segment vertically
  const smallSegmentSpacing = 103; // inches (101.82" + 1.18")
  const smallSegmentWidth = 46.54; // inches (calculated red box width)

  // Add small segments
  for (let i = 0; i < smallSegments.count; i++) {
    segments.push({
      x: 0,
      y: currentY,
      length: smallDims.length,
      width: smallDims.width,
      color: smallSegments.color,
      label: `S${i + 1}`,
    });
    currentY += smallSegmentSpacing * scale;
  }

  // Add large segments
  for (let i = 0; i < largeSegments.count; i++) {
    segments.push({
      x: 0,
      y: currentY,
      length: largeDims.length,
      width: largeDims.width,
      color: largeSegments.color,
      label: `L${i + 1}`,
    });
    // Height needed is diameter (2 * outer radius)
    const segmentHeight = largeSegments.outerDiameter * scale;
    currentY += segmentHeight;
  }

  // Set canvas size
  const canvasHeight = currentY;
  const canvasWidth = smallSegmentWidth * scale; // Width based on small segment width
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Clear and fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw segments as actual arc shapes
  segments.forEach(segment => {
    ctx.save();

    // Determine segment parameters
    const isSmall = segment.label.startsWith('S');
    const outerDiameter = isSmall ? smallSegments.outerDiameter : largeSegments.outerDiameter;
    const outerRadius = (outerDiameter / 2) * scale;

    // Center the segment horizontally in the canvas
    const centerX = (canvasWidth / 2);
    const centerY = segment.y + outerRadius;

    // Draw the segment using the appropriate function
    if (isSmall) {
      drawSmallStageSegment(ctx, centerX, centerY, scale);
    } else {
      drawLargeStageSegment(ctx, centerX, centerY, scale);
    }

    ctx.restore();
  });
};
