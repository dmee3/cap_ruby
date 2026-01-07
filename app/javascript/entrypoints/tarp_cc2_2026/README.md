# CC2 2026 Tarp Design Tool

## Overview

This is a canvas-based design tool for creating a visual mockup of the CC2 (Cap City 2) 2026 performance tarp. The tarp will be used during competitive performances and serves as the visual foundation for the show.

## Physical Specifications

- **Dimensions**: 84 feet wide × 42 feet tall (configurable via `TARP_WIDTH_FEET` and `TARP_HEIGHT_FEET`)
- **Scale Factor**: Configurable via `SCALE` constant (pixels per inch)
- **Canvas Size**: Calculated as tarp dimensions × SCALE
- **Base Unit**: All measurements in code are in inches, then multiplied by SCALE

## Configuration

All visual parameters are centralized in the `CONFIG` object at the top of the file. This includes:

### Ribbon Configuration (`CONFIG.ribbons`)
- **width**: Ribbon width in feet (perpendicular to ribbon direction)
- **segmentLength**: Pattern segment length in feet (along ribbon direction)
- **spacingMultiplier**: Ribbon spacing as multiple of ribbon width (center-to-center distance)
- **lengthMultiplier**: Ribbon length as multiple of tarp diagonal
- **layers**: Array of ribbon layer definitions, drawn in order (first = bottom, last = top)
  - Each layer has:
    - **direction**: `'warp'` (26.57°) or `'weft'` (153.43°)
    - **position**: `'center'`, `'above'`, or `'below'` (perpendicular offset from center)
    - **patternOffset**: Starting pattern index (0-3 for rings, greekKey, octagons, rectangles)
    - **shift**: Distance to shift ribbon along its direction in feet (positive = forward, negative = backward)

**Example layer configuration:**
```typescript
layers: [
  { direction: 'warp', position: 'center', patternOffset: 0, shift: 0 },     // Bottom layer
  { direction: 'weft', position: 'center', patternOffset: 2, shift: 5 },     // Shifted 5 feet forward
  { direction: 'warp', position: 'above', patternOffset: 2, shift: -3 },     // Shifted 3 feet backward
  { direction: 'weft', position: 'above', patternOffset: 0, shift: 0 },
  { direction: 'warp', position: 'below', patternOffset: 3, shift: 12 },     // Shifted 12 feet forward
  { direction: 'weft', position: 'below', patternOffset: 0, shift: 0 },      // Top layer
]
```

**Shift parameter usage:**
- Allows fine-tuning where ribbons intersect and overlap
- Positive values shift the ribbon forward along its angle direction
- Negative values shift the ribbon backward
- Measured in feet for easy alignment with segment lengths (typically 24 feet)

### Pattern Configuration (`CONFIG.patterns`)
- **order**: Array defining pattern order (e.g., `['rings', 'greekKey', 'octagons', 'rectangles']`)
- **rings**: Ring pattern colors (ringColor, borderColor, backgroundColor), ringRadius, seedBase
- **greekKey**: Greek key pattern colors (patternColor, backgroundColor), keySize, seedBase
- **rectangles**: Rectangle pattern colors array, accentColor, backgroundColor, seedBase
- **octagons**: Octagon pattern colors (octagonColor, backgroundColor), octagonSize, seedBase

### Weave Configuration (`CONFIG.weave`)
- **warpThreads.angle**: Angle in degrees for warp threads (lower-left to upper-right)
- **weftThreads.angle**: Angle in degrees for weft threads (upper-left to lower-right)
- Thread count, length ranges, opacity, and variation parameters

### Topography Configuration (`CONFIG.topography`)
- **sampleRate**: Sample size as fraction of spacing for overlay rendering
- **scaleMultiplier**: Height map scale as multiple of spacing

## Design Elements

### 1. Background & Scratches

**Background Color**: Dark grey

**Scratch Marks**:
- Purpose: Create a worn, textured appearance
- Count: Configurable in `CONFIG.scratches.count`
- Length: Random within configurable min/max range
- Width: Configurable base width with random variation (0.7-1.3x)
- Angle: Configurable angle above horizontal
- Direction: Alternates between two complementary angles (angle and 180° - angle)
- Opacity: Configurable
- Color: Black
- Shape: Tapered at both ends using sine wave (widest at center, points at ends)

### 2. Pattern Swatches

The tool displays four decorative pattern options as swatches for review:

**Swatch Specifications**:
- Dimensions and spacing defined in code (see useEffect)
- Layout: First row with 3 patterns, second row with 1 centered pattern
- Background colors vary by pattern (warm beige for patterns 1-3, teal for pattern 4)

#### Pattern 1: Interlocking Rings

**Location**: First swatch

**Design Details**:
- Configurable ring radius (parameter to function)
- Ring spacing: 1.6 × ring radius
- Grid pattern with no offset between rows
- Ring color: Teal/blue-grey
- Border color: White
- Two-layer design: wider outer border, narrower inner ring

**Interlocking Effect**:
The rings use a sophisticated segmented drawing approach to create a realistic weaving/chain mail effect:

- Each ring is divided into 8 segments of 45° each
- Segments are drawn in a specific order across ALL rings (not ring-by-ring)
- Drawing order alternates to create over/under weaving effect
- Inner ring segments are slightly extended to eliminate visible gaps
- This creates the visual effect of rings weaving over and under each other

**Implementation**: `drawInterlockingRings()` function

#### Pattern 2: Greek Key

**Location**: Second swatch

**Design Details**:
- Repeating tiled pattern across swatch area
- Configurable key unit size (parameter to function)
- Square line caps and miter joins for clean corners
- Color: Grey
- Pattern divided into 7 equal units per key
- Slightly tighter vertical spacing for better tiling

**Pattern Structure**:
Each Greek key unit is a symmetrical meander pattern with four spiral corners:

- **Left Side**: Upper and lower spirals that create inward rectangular patterns, connected by a vertical line
- **Right Side**: Mirror image of left side spirals
- **Vertical Centerline**: Connects all four spirals through the middle
- All spirals create a continuous, maze-like geometric pattern

**Implementation**: `drawGreekKey()` and `drawGreekKeyUnit()` functions

#### Pattern 3: Random Rectangles (Mondrian-style)

**Location**: Third swatch

**Design Details**:
- Abstract overlapping rectangles
- Colors: Greyscale palette (multiple grey shades)
- Randomization: Seeded random for reproducible pattern
- Rectangle dimensions and positions randomly generated within bounds
- Color selection: Random from palette

**Implementation**: `drawRandomRectangles()` function

#### Pattern 4: Octagons

**Location**: Second row, centered

**Design Details**:
- Configurable octagon size (parameter to function)
- Grid spacing proportional to octagon size
- Octagon color: Muted gold
- Background color: Dark blue
- Line widths proportional to octagon size

**Octagon Structure**:
- Regular octagons with 8 sides (horizontal/vertical edges emphasized)
- Arranged in regular grid pattern
- Drawing order: background → octagons → topographical overlay → grain texture

**Implementation**: `drawOctagons()` function

#### Pattern 5: Curved Towers

**Location**: Separate file `patterns/curvedTowers.ts`

**Design Details**:
- Repeating tile-based pattern
- Default tile size: 32 inches (height), 64 inches (width = 2 × tile size)
- Each tile contains 4 horizontal lines spaced evenly across 32 inches
- Configurable line width: 1 inch (default)

**Tower Structure**:
A "tower" is composed of curved elements that create a vertical architectural form:

- **Top Cap**: Two quarter circles between lines (opening upward)
  - One at the right edge
  - One radius (8") to the left
- **Body**: Half circle connecting the two sides (vertical orientation, opens left)
  - Positioned one radius left of the second quarter circle
- **Bottom Cap**: Two quarter circles (opening downward, mirror of top)

**Tower Configuration**:
Each tower has two parameters:
- `xPos`: Horizontal position of the tower's right edge
- `startLine`: Which line the tower starts from (0 = tile edge, 1-4 = major lines)

**Tile Composition**:
Each tile contains:
1. **Four horizontal lines** spanning the full tile width
2. **Tower 1**: Full tower at right edge (startLine = 0)
3. **Tower 2**: Partial tower at midpoint (startLine = 2, only bottom cap visible)
4. **Tower 3**: Partial tower at midpoint (startLine = -2, extends above tile)
5. **Three sub-lines** connecting towers:
   - Sub-line 1: Between lines 0-1, connects tower 3 body to tower 1 top cap
   - Sub-line 2a: Between lines 2-3, from right edge to tower 1 body
   - Sub-line 2b: Between lines 2-3, from tower 2 top cap to left edge

**Tiling Behavior**:
- Pattern tiles horizontally every 64" (2 × tileSize)
- Pattern tiles vertically every 32" (tileSize)
- Tiles overlap slightly (-1 start index) to ensure seamless edges
- Covers entire canvas section passed to function

**Geometric Calculations**:
Sub-lines intersect with circular tower elements using circle-line intersection math:
- Circle equation: `(x - cx)² + (y - cy)² = r²`
- For horizontal line at y: `dx = √(r² - (y - cy)²)`
- Helper function `getCircleIntersectionDx()` handles all intersection calculations

**Implementation Files**:
- Main pattern: `patterns/curvedTowers.ts`
- Helper functions:
  - `getCircleIntersectionDx()`: Calculate circle-line intersections
  - `getTowerPositions()`: Get all position data for a tower
  - `drawHorizontalLines()`: Draw the base horizontal lines
  - `drawTower()`: Draw a complete or partial tower
  - `drawSingleTile()`: Draw one complete tile
  - `drawCurvedTowers()`: Main export function, handles tiling

**Constants**:
- `SUBLINE_1_POSITION = 0.5`: Position between lines 0 and 1
- `SUBLINE_2_POSITION = 2.5`: Position between lines 2 and 3

**Code Organization**:
The code is organized in layers of abstraction:
1. **Constants**: Named positions for sub-lines
2. **Helpers**: Geometric calculations and position getters
3. **Primitives**: Draw individual elements (lines, towers)
4. **Composition**: Combine elements into a tile
5. **Export**: Handle tiling across the canvas

This structure reduces tight coupling and makes the pattern easy to modify or extend.

**Usage Example**:
```typescript
import { drawCurvedTowers } from './patterns/curvedTowers';

// In your drawing code:
drawCurvedTowers(
  ctx,                    // Canvas 2D context
  x,                      // X position
  y,                      // Y position
  width,                  // Width of section to fill
  height,                 // Height of section to fill
  angle,                  // Rotation angle in degrees
  lineColor,              // Color for all lines and curves
  backgroundColor,        // Background fill color
  32                      // Tile size in inches (optional, default: 32)
);
```

**Modification Tips**:
- To change tower positions: Modify tower X positions in `drawSingleTile()`
- To add more sub-lines: Add calculations in `drawSingleTile()` using `getCircleIntersectionDx()`
- To change tile dimensions: Modify `tileSize` parameter or calculation in `drawCurvedTowers()`
- To adjust spacing: Change the line spacing calculation (currently `tileSize / 4`)

## Code Structure

### Main Component: `TarpCC22026`

React functional component that renders a single canvas element.

### Key Functions

**Pattern Renderers** (all in `patterns/` directory):
1. **`drawInterlockingRings()`**: Creates chain mail-style interlocking rings
2. **`drawGreekKey()`**: Draws repeating Greek meander pattern with helper `drawGreekKeyUnit()`
3. **`drawRandomRectangles()`**: Creates Mondrian-style abstract rectangles
4. **`drawOctagons()`**: Draws octagon grid pattern with connecting lines
5. **`drawArtDecoPattern()`**: Draws art deco geometric pattern with radial lines
6. **`drawWeave()`**: Draws woven thread texture with tapered threads
7. **`drawCurvedTowers()`**: Draws curved towers pattern with towers and sub-lines

**Helper Functions** (in `utils.ts`):
- **`createSeededRandom()`**: Generate reproducible random numbers
- **`rayLineIntersection()`**: Calculate ray-line segment intersections (used by art deco)
- **`distance()`**: Calculate Euclidean distance between points

**Main Component** (in `index.tsx`):
- **`drawSingleRibbon()`**: Orchestrates drawing pattern segments along a ribbon path

### useEffect Hook

Runs once on component mount to:
1. Set canvas dimensions
2. Fill background
3. Draw scratch texture
4. Draw all pattern swatches
5. Add labels to each swatch

## Development Notes

### Coordinate System
- Origin (0,0) is top-left
- Angles measured in radians
- 0° is to the right (3 o'clock position)
- Angles increase clockwise

### Drawing Order
Critical for achieving proper visual effects:
1. Background fill
2. Scratch marks (with opacity)
3. Pattern swatches (each pattern fills its own background first)
4. Text labels

### Performance Considerations
- High SCALE values create very large canvases
- Each scratch is drawn individually
- Interlocking rings require multiple passes over all rings
- Consider reducing scratch count or SCALE for development/testing

### Color Palette
All color values are defined in the code. Key colors include:
- **Background**: Dark grey
- **Scratches**: Black
- **Swatch backgrounds**: Warm beige (patterns 1-3), Teal (pattern 4)
- **Interlocking Rings**: Teal rings with white borders
- **Greek Key**: Grey
- **Random Rectangles**: Greyscale palette (multiple shades)
- **Octagons**: Warm beige octagons with grey grid lines on teal background

## Future Enhancements

Potential areas for expansion:
- Interactive pattern selection/preview
- Pattern rotation controls
- Color customization UI
- Export to different formats/resolutions
- Pattern density controls
- Multiple pattern combinations
- Real-time preview at different scales

## File Location

`/Users/danmeehan/Stuff/Cap/cap_ruby/app/javascript/entrypoints/tarp_cc2_2026/index.tsx`

## Project Structure

```
app/javascript/entrypoints/tarp_cc2_2026/
├── index.tsx                 # Main React component
├── config.ts                 # Centralized configuration (SCALE, CONFIG)
├── utils.ts                  # Helper utilities (seeded random, geometry)
├── types.ts                  # TypeScript type definitions
├── patterns/
│   ├── rings.ts             # Interlocking rings pattern
│   ├── greekKey.ts          # Greek key meander pattern
│   ├── rectangles.ts        # Mondrian-style rectangles
│   ├── octagons.ts          # Octagon grid pattern
│   ├── artDeco.ts           # Art deco geometric pattern
│   ├── weave.ts             # Woven thread texture
│   └── curvedTowers.ts      # Curved towers pattern
└── README.md                # This file
```

## Related Files

- View template: `/Users/danmeehan/Stuff/Cap/cap_ruby/app/views/tools/tarp_cc2_2026.html.erb`
- Route: Defined in `config/routes.rb`
