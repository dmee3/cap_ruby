// Tarp dimensions in feet
export const TARP_WIDTH_FEET = 84;
export const TARP_HEIGHT_FEET = 42;

// Canvas overhang (to show ribbon extensions beyond tarp edges)
export const CANVAS_OVERHANG_FEET = 20; // 20 feet on each side

// Convert to inches (base unit: 1 pixel = 1 inch at SCALE = 1)
export const TARP_WIDTH_INCHES = TARP_WIDTH_FEET * 12;  // 1,008 inches
export const TARP_HEIGHT_INCHES = TARP_HEIGHT_FEET * 12; // 504 inches

// Canvas dimensions (tarp + overhang on all sides)
export const CANVAS_WIDTH_INCHES = TARP_WIDTH_INCHES + (CANVAS_OVERHANG_FEET * 12 * 2);  // Tarp + 20ft each side
export const CANVAS_HEIGHT_INCHES = TARP_HEIGHT_INCHES + (CANVAS_OVERHANG_FEET * 12 * 2); // Tarp + 20ft each side

// Scale factor: pixels per inch
// SCALE = 1: 1,008 × 504 px (1 pixel per inch, print-ready)
// SCALE = 10: 10,080 × 5,040 px (10 pixels per inch, high-res)
export const SCALE = 10;

// Configuration constants
export const CONFIG = {
  colors: {
    background: '#222', // Dark grey background
    threads: '#000000', // Black threads
    guideThreads: '#dec573', // Bright red guide threads
  },
  weave: {
    warpThreads: {
      count: 450, // Number of warp threads (one direction)
      angle: 26.57, // Angle in degrees (lower-left to upper-right diagonal, arctan(42/84))
      minLength: 36, // Minimum length in inches (creates "holes")
      maxLength: 240, // Maximum length in inches (some span most of canvas)
    },
    weftThreads: {
      count: 450, // Number of weft threads (other direction)
      angle: 153.43, // Complementary angle in degrees (180 - 26.57)
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
  ribbons: {
    width: 5, // Ribbon width in feet (perpendicular to ribbon direction)
    spacingMultiplier: 3.2, // Ribbon spacing as multiple of ribbon width (16 feet center-to-center)
    guideThreadCount: 8, // Number of guide threads per ribbon (6-10 recommended)
    // Ribbon layers drawn in array order (first = bottom layer, last = top layer)
    layers: [
      // Center warp ribbon
      {
        direction: 'warp' as const,
        position: 'center' as const,
        shift: 2.02,
        segmentArray: [
          { pattern: 'rings' as const, length: 15.96, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'artDeco' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'curvedTowers' as const, length: 20, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'rings' as const, length: 20, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'octagons' as const, length: 20, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
        ],
      },
      // Above weft ribbon
      {
        direction: 'weft' as const,
        position: 'above' as const,
        shift: 15.52,
        segmentArray: [
          { pattern: 'octagons' as const, length: 12.96, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'curvedTowers' as const, length: 20, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'rings' as const, length: 20, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
        ],
      },
      // Below weft ribbon
      {
        direction: 'weft' as const,
        position: 'below' as const,
        shift: -8.48,
        segmentArray: [
          { pattern: 'rings' as const, length: 12.96, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'octagons' as const, length: 20, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'curvedTowers' as const, length: 20, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
        ],
      },
      // Below warp ribbon (how?)
      {
        direction: 'warp' as const,
        position: 'above' as const,
        shift: -8.48,
        segmentArray: [
          { pattern: 'curvedTowers' as const, length: 12.96, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'octagons' as const, length: 20, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'artDeco' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'rings' as const, length: 20, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
        ],
      },
      // Above warp ribbon (how?)
      {
        direction: 'warp' as const,
        position: 'below' as const,
        shift: 14.5, // Adjusted offset by half the reduction (0.5)
        segmentArray: [
          { pattern: 'rings' as const, length: 15, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'octagons' as const, length: 20, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'artDeco' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
        ],
      },
      // Center weft ribbon
      {
        direction: 'weft' as const,
        position: 'center' as const,
        shift: 2.02,
        segmentArray: [
          { pattern: 'octagons' as const, length: 15.96, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'artDeco' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'rings' as const, length: 20, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'greekKey' as const, length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'curvedTowers' as const, length: 20, colors: { background: '#2a3b4c', primary: '#dec573', accent: '#dec573' } },
          { pattern: 'octagons' as const, length: 20, colors: { background: '#162745', primary: '#dec573', accent: '#dec573' } },
        ],
      },
    ],
  },
  patterns: {
    rings: {
      ringRadius: 16, // Radius in inches
    },
    greekKey: {
      keySize: 25.6, // Size of each key unit in inches
    },
    octagons: {
      octagonSize: 10, // Size in inches
    },
    artDeco: {
      gridSize: 16, // Size of each tile in inches (affects pattern density)
    },
    curvedTowers: {
      tileSize: 24, // Total height of one repeating tile in inches (affects vertical pattern scale)
    },
  },
  topography: {
    sampleRate: 0.0625, // Sample size as fraction of spacing (1/16)
    scaleMultiplier: 1.5, // Height map scale as multiple of spacing
  },
} as const;
