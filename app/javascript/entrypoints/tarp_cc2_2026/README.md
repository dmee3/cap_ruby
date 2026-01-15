# CC2 2026 Tarp Design Tool

## Overview

This is a canvas-based design tool for creating a visual mockup of the CC2 (Cap City 2) 2026 performance tarp. The tarp will be used during competitive performances and serves as the visual foundation for the show.

**CRITICAL ARCHITECTURAL REQUIREMENT:**

The tarp design consists of two outputs:
1. **Main Tarp Canvas**: The full tarp with all ribbons positioned and rotated in place
2. **Individual Ribbon Canvases**: Each ribbon rendered separately for printing

**⚠️ CRITICAL: Single Source of Truth for Ribbon Rendering**

It is **ABSOLUTELY CRITICAL** that ribbons are rendered using a single source of truth. The architecture MUST maintain:

1. **One Pre-Rendering Function**: `renderRibbonToCanvas()` is the ONLY place where ribbon content is created
2. **No Duplicate Effects**: Every visual effect on a ribbon (fraying, patterns, gold trim, etc.) MUST be applied exactly once, in `renderRibbonToCanvas()`
3. **No Parameter Variations**: The same pre-rendered ribbon canvas MUST be used for both:
   - Individual ribbon display (direct copy with `ctx.drawImage()`)
   - Main tarp display (positioned and rotated with `ctx.drawImage()`)
4. **Rotation/Position Only**: The ONLY differences between main canvas and individual canvas are rotation and positioning transforms applied AFTER the ribbon is fully rendered

**Why This Matters:**
- Ensures individual ribbons (for printing) EXACTLY match what appears on the main tarp
- Prevents subtle visual differences from accumulating
- Makes debugging easier - there's only one rendering path
- Guarantees consistency when changing effects like fraying width, pattern colors, etc.

**Current Implementation:**
```typescript
// STEP 1: Pre-render each ribbon once (single source of truth)
const ribbonCanvases = CONFIG.ribbons.layers.map((_, index) => renderRibbonToCanvas(index));

// STEP 2a: Draw on main canvas with position/rotation transforms
drawRibbons(ctx, width, height, ribbonCanvases); // Uses ctx.drawImage() with transforms

// STEP 2b: Draw on individual canvases (direct copy, no transforms)
CONFIG.ribbons.layers.forEach((_, index) => {
  drawIndividualRibbon(displayCanvas, ribbonCanvases[index]); // Uses ctx.drawImage()
});
```

**Forbidden Patterns:**
- ❌ Applying fraying in two different places
- ❌ Calling pattern renderers with different parameters for individual vs main canvas
- ❌ Drawing gold trim separately for individual ribbons
- ❌ Any effect that exists in multiple code paths

**Allowed Patterns:**
- ✅ Rotating/translating the pre-rendered ribbon canvas for main tarp placement
- ✅ Calculating ribbon positions based on configuration
- ✅ Drawing guide threads separately (they're part of the base tarp, not the ribbons)

## Physical Specifications

- **Dimensions**: 84 feet wide × 42 feet tall (configurable via `TARP_WIDTH_FEET` and `TARP_HEIGHT_FEET`)
- **Canvas Overhang**: 12 feet on all sides (configurable via `CANVAS_OVERHANG_FEET`) to show ribbon extensions beyond tarp edges
- **Scale Factor**: 16 pixels per inch (configurable via `SCALE` constant)
  - At SCALE = 16: Main canvas is 19,008 × 12,672 pixels (includes overhang)
  - Limited to 16 to avoid browser canvas size limits (~32,767 pixels max dimension)
  - Longest ribbon (~116 feet) = 22,272 pixels at SCALE 16 (within limits)
- **Base Unit**: All measurements in code are in inches, then multiplied by SCALE

## Configuration

All visual parameters are centralized in `config.ts` in the `CONFIG` object. This includes:

### Colors (`CONFIG.colors`)
- **background**: Dark grey (#222) for the tarp background
- **threads**: Black (#000000) for weave threads
- **guideThreads**: Dark grey (#404040) for guide threads marking ribbon paths

### Weave Configuration (`CONFIG.weave`)
- **warpThreads**: Threads running at 26.57° (lower-left to upper-right diagonal)
  - count: 450 threads
  - angle: 26.57° (arctan(42/84), matching tarp aspect ratio)
  - minLength: 36 inches (creates "holes" in the weave)
  - maxLength: 240 inches (some threads span most of canvas)
- **weftThreads**: Threads running at 153.43° (complementary angle)
  - count: 450 threads
  - angle: 153.43° (180 - 26.57°)
  - minLength: 36 inches
  - maxLength: 240 inches
- **baseWidth**: 2 inches at center of thread (tapered at ends)
- **opacity**: 1.0 (fully opaque, no transparency)
- **seed**: 54321 (for reproducible randomness)
- **variation**:
  - positionOffset: 0.15 (position offset from grid as fraction of spacing)
  - thicknessVariation: 0.2 (thickness varies 0.8-1.2x)
  - curveAmount: 0.3 (thread curvature at intersections in thread widths)

### Ribbon Configuration (`CONFIG.ribbons`)
- **width**: 5 feet (perpendicular to ribbon direction)
- **spacingMultiplier**: 3.2 (ribbon spacing as multiple of ribbon width = 16 feet center-to-center)
- **guideThreadCount**: 8 threads per ribbon (6-10 recommended, marks ribbon path on base tarp)
- **layers**: Array of ribbon layer definitions, drawn in order (first = bottom, last = top)

Each layer has:
- **direction**: `'warp'` (26.57°) or `'weft'` (153.43°)
- **position**: `'center'`, `'above'`, or `'below'` (perpendicular offset from tarp center)
- **shift**: Distance to shift ribbon along its direction in feet (positive = forward, negative = backward)
- **segmentArray**: Array of pattern segments that make up the ribbon
  - Each segment has:
    - **pattern**: Pattern type ('rings', 'greekKey', 'octagons', 'artDeco', 'curvedTowers')
    - **length**: Segment length in feet
    - **colors**: Object with background, primary, and accent colors

**Example layer configuration:**
```typescript
{
  direction: 'warp',
  position: 'center',
  shift: 2.02,
  segmentArray: [
    { pattern: 'rings', length: 15.96, colors: { background: '#3b4b65', primary: '#dec573', accent: '#dec573' } },
    { pattern: 'greekKey', length: 20, colors: { background: '#3f3e3a', primary: '#dec573', accent: '#dec573' } },
    // ... more segments
  ]
}
```

**Shift parameter usage:**
- Allows fine-tuning where ribbons intersect and overlap
- Positive values shift the ribbon forward along its angle direction
- Negative values shift the ribbon backward
- Measured in feet for easy alignment with segment lengths

### Pattern Configuration (`CONFIG.patterns`)
- **rings**: ringRadius (16 inches)
- **greekKey**: keySize (25.6 inches)
- **octagons**: octagonSize (10 inches)
- **artDeco**: gridSize (16 inches, affects pattern density)
- **curvedTowers**: tileSize (24 inches, affects vertical pattern scale)

### Topography Configuration (`CONFIG.topography`)
- **sampleRate**: 0.0625 (sample size as fraction of spacing, 1/16)
- **scaleMultiplier**: 1.5 (height map scale as multiple of spacing)

## Design Elements

### 1. Base Tarp Layer

**Woven Thread Texture**:
- Purpose: Create a realistic fabric texture as the base layer
- Implementation: Randomly positioned threads at warp/weft angles
- Thread count: 450 threads each direction (900 total)
- Thread characteristics:
  - Tapered at both ends (sine wave taper, widest at center)
  - Random lengths (36-240 inches) creating a threadbare effect with "holes"
  - Random thickness variation (0.8-1.2x base width of 2 inches)
  - Fully opaque (opacity: 1.0)
  - Color: Black (#000000)
- Angles match ribbon directions for visual consistency
- Seeded random ensures reproducible pattern

**Guide Threads**:
- Purpose: Mark the path where each ribbon will be placed on the tarp
- Count: 8 threads per ribbon (configurable)
- Distribution: Evenly spaced along ribbon centerline
- Positioning: Random perpendicular offset (±15% of ribbon width) for natural look
- Characteristics:
  - Same length range as weave threads (36-240 inches)
  - Same thickness variation as weave threads
  - Align with parent ribbon's angle (warp or weft)
  - Color: Dark grey (#404040)
  - Opacity: 1.0 (fully opaque)
  - Clipped to tarp bounds (not drawn in overhang area)
- Drawn before ribbons so ribbons appear on top

### 2. Ribbon Layers

**Architecture:**
Ribbons are rendered using an off-screen canvas pre-rendering approach:

1. **Pre-Rendering** (`renderRibbonToCanvas()`):
   - Creates an off-screen canvas for each ribbon
   - Renders ribbon horizontally (unrotated) with all effects:
     - Pattern segments (rings, greek key, etc.)
     - Gold border lines (2" offset, 1.5" wide)
     - Fraying effect at the start (using destination-out compositing)
   - Returns the complete ribbon canvas

2. **Main Canvas Placement** (`drawSingleRibbon()`):
   - Takes pre-rendered ribbon canvas
   - Calculates position based on: direction, position (center/above/below), shift
   - Applies rotation and translation transforms
   - Draws using `ctx.drawImage()` (positioned and rotated)

3. **Individual Canvas Display** (`drawIndividualRibbon()`):
   - Takes same pre-rendered ribbon canvas
   - Copies directly to display canvas using `ctx.drawImage()`
   - No transforms (shows ribbon as originally rendered)

**Fraying Effect:**
- Applied to the start (left edge) of the first segment in each ribbon
- Uses `destination-out` globalCompositeOperation to erase triangular sections
- Creates 20 frayed threads with random positions across ribbon width
- Each thread:
  - Random length (30%-100% of fray zone, typically 5 feet)
  - Triangular shape (base width: 2/3 of thread width, ~2 inches at SCALE 16)
  - Aligns with ribbon's angle (warp or weft)
  - Overlapping triangles properly erase (no toggle-back artifacts)
- **CRITICAL**: Only applied once in `renderRibbonToCanvas()`, never duplicated

**Rendering Order:**
1. Base tarp background (dark grey)
2. Woven thread texture
3. Guide threads (for all ribbons)
4. Ribbon layers (bottom to top, as defined in config)

### 3. Pattern Library

The tool includes six decorative pattern types, rendered within ribbon segments:

#### Pattern 1: Interlocking Rings

**Design Details**:
- Configurable ring radius (default: 16 inches)
- Ring spacing: 1.6 × ring radius
- Grid pattern with slight vertical inset for centering
- Ring color: Gold (#dec573)
- Line width: 1.6 inches (configurable via SCALE)
- Creates chain mail-like appearance

**Implementation**: `patterns/rings.ts` → `drawInterlockingRings()`

#### Pattern 2: Greek Key

**Design Details**:
- Repeating tiled pattern across segment area
- Configurable key unit size (default: 25.6 inches)
- Square line caps and miter joins for clean corners
- Color: Gold (#dec573)
- Pattern divided into 7 equal units per key
- Symmetrical meander pattern with four spiral corners

**Pattern Structure**:
- Left side: Upper and lower spirals connected by vertical line
- Right side: Mirror image of left spirals
- Vertical centerline: Connects all four spirals
- Creates continuous, maze-like geometric pattern

**Implementation**: `patterns/greekKey.ts` → `drawGreekKey()`

#### Pattern 3: Octagons

**Design Details**:
- Configurable octagon size (default: 10 inches)
- Grid spacing proportional to octagon size
- Octagon color: Gold (#dec573)
- Line widths proportional to octagon size
- Regular octagons arranged in grid pattern

**Implementation**: `patterns/octagons.ts` → `drawOctagons()`

#### Pattern 4: Art Deco

**Design Details**:
- Geometric pattern with radial lines emanating from grid points
- Configurable grid size (default: 16 inches)
- Color: Gold (#dec573)
- Creates angular, architectural aesthetic
- Uses ray-line intersection calculations for complex geometry

**Implementation**: `patterns/artDeco.ts` → `drawArtDecoPattern()`

#### Pattern 5: Curved Towers

**Design Details**:
- Repeating tile-based pattern
- Default tile size: 24 inches (height), 48 inches (width = 2 × tile size)
- Each tile contains 4 horizontal lines spaced evenly
- Configurable line width: 1 inch (default)
- Color: Gold (#dec573)

**Tower Structure**:
A "tower" is composed of curved elements creating a vertical architectural form:
- **Top Cap**: Two quarter circles between lines (opening upward)
- **Body**: Half circle connecting the two sides (vertical orientation, opens left)
- **Bottom Cap**: Two quarter circles (opening downward, mirror of top)

**Geometric Calculations**:
- Uses circle-line intersection math for sub-lines
- Circle equation: `(x - cx)² + (y - cy)² = r²`
- For horizontal line at y: `dx = √(r² - (y - cy)²)`

**Implementation**: `patterns/curvedTowers.ts` → `drawCurvedTowers()`

#### Pattern 6: Woven Thread Texture

**Design Details**:
- Random threads at configurable angles
- Thread characteristics: tapered ends, random lengths (36-240 inches)
- Creates threadbare effect with "holes" (shorter threads)
- Color: Black (#000000)
- Opacity: 1.0 (fully opaque)
- Used for base tarp layer

**Implementation**: `patterns/weave.ts` → `drawWeave()`

### 4. Pattern Helpers

**Gold Border Lines** (`patternHelpers.ts`):
- Drawn on top and bottom edges of each pattern segment
- Position: 2 inches from edge
- Width: 1.5 inches
- Color: Gold (#dec573)
- Applied with rotation matching segment orientation

**Pattern Inset**:
- Creates 5-inch inset from top/bottom edges (default)
- Patterns are clipped to inset region
- Ensures consistent spacing from gold border lines

## Code Structure

### Main Component: `TarpCC22026`

React functional component that renders:
1. Main tarp canvas (full tarp with positioned ribbons)
2. Individual ribbon canvases (one per ribbon, displayed in grid below main canvas)

### File Organization

```
app/javascript/entrypoints/tarp_cc2_2026/
├── index.tsx                 # Main React component and ribbon rendering logic
├── config.ts                 # Centralized configuration (SCALE, CONFIG)
├── utils.ts                  # Helper utilities (seeded random, geometry)
├── types.ts                  # TypeScript type definitions
├── patternHelpers.ts         # Gold border and pattern inset helpers
├── patterns/
│   ├── rings.ts             # Interlocking rings pattern
│   ├── greekKey.ts          # Greek key meander pattern
│   ├── octagons.ts          # Octagon grid pattern
│   ├── artDeco.ts           # Art deco geometric pattern
│   ├── weave.ts             # Woven thread texture
│   └── curvedTowers.ts      # Curved towers pattern
└── README.md                # This file
```

### Key Functions (in index.tsx)

**Ribbon Rendering Pipeline:**

1. **`renderRibbonToCanvas(layerIndex: number): HTMLCanvasElement`**
   - **THE SINGLE SOURCE OF TRUTH** for ribbon appearance
   - Creates off-screen canvas sized to ribbon total length × ribbon width
   - Renders all pattern segments horizontally in sequence
   - Applies gold border lines to each segment
   - Applies fraying effect to first segment (destination-out compositing)
   - Returns complete ribbon canvas
   - **CRITICAL**: This is the ONLY place where ribbon content is created

2. **`drawSingleRibbon(ctx, ribbonCanvas, angle, ribbonWidth, centerX, centerY, ribbonSpacing, position, shift, ribbonTotalLength)`**
   - Takes pre-rendered ribbon canvas
   - Calculates ribbon position on main tarp:
     - Start from tarp center (centerX, centerY)
     - Apply perpendicular offset based on position (center/above/below) and spacing
     - Apply directional shift along ribbon angle
   - Applies rotation transform matching ribbon direction (warp or weft)
   - Draws ribbon using `ctx.drawImage()` with transforms
   - **Does NOT modify ribbon appearance** - only positions/rotates it

3. **`drawIndividualRibbon(canvas, ribbonCanvas)`**
   - Takes pre-rendered ribbon canvas
   - Copies directly to display canvas using `ctx.drawImage()`
   - **No transforms, no modifications** - pure copy operation

4. **`drawRibbons(ctx, width, height, ribbonCanvases)`**
   - Draws guide threads for all ribbons (on base tarp)
   - Iterates through ribbon layers (bottom to top)
   - Calls `drawSingleRibbon()` for each ribbon with its pre-rendered canvas

**Fraying Functions:**

5. **`createFrayingClipPath(ctx, ribbonStartX, ribbonStartY, ribbonWidth, ribbonAngleDeg, frayLengthFeet, ribbonIndex)`**
   - Generates frayed thread positions using seeded random
   - Creates 20 threads with random positions across ribbon width
   - Each thread has random length (30%-100% of fray zone)
   - Returns thread data (start/end positions, angle)
   - **Does not modify canvas** - just calculates positions

6. **`drawFrayingEffect(ctx, ribbonStartX, ribbonStartY, ribbonWidth, angleDeg, frayLengthFeet, ribbonIndex, applyClipping, segmentLengthPx)`**
   - Gets thread positions from `createFrayingClipPath()`
   - Uses `destination-out` globalCompositeOperation
   - Draws each thread as a filled triangular shape to erase it
   - Triangle base width: 2/3 of thread width (~2 inches at SCALE 16)
   - Overlapping triangles properly accumulate (always erase, never un-erase)
   - **Called ONLY from `renderRibbonToCanvas()`** - never duplicated

**Guide Thread Functions:**

7. **`drawGuideThreads(ctx, angleDeg, ribbonWidth, centerX, centerY, ribbonSpacing, position, shift, layerIndex, segmentArray, canvasWidth, canvasHeight)`**
   - Draws guide threads marking ribbon path on base tarp
   - Generates thread positions using seeded random (unique per ribbon)
   - 8 threads evenly distributed along ribbon centerline
   - Random perpendicular offset (±15% of ribbon width)
   - Same characteristics as weave threads (length, thickness, taper)
   - Clipped to tarp bounds (not drawn in overhang area)
   - Called before ribbons are drawn (so ribbons appear on top)

8. **`drawThread(ctx, x, y, length, angle, baseWidth)`**
   - Helper function used by weave and guide threads
   - Draws a single tapered thread
   - 20 segments for smooth taper
   - Sine wave taper: widest at center, points at ends
   - Width = 0 at ends, baseWidth at center

**Overhang Calculation:**

9. **`calculateRibbonOverhang(layerIndex: number)`**
   - Calculates how much each ribbon extends beyond tarp edges
   - Traces from ribbon start position to find tarp entry point
   - Traces from ribbon end position to find tarp exit point
   - Returns `{ startOverhang, endOverhang }` in pixels and feet
   - Used for display purposes only (not for rendering)

**Helper Functions** (in `utils.ts`):
- **`createSeededRandom(seed: number)`**: Generate reproducible random numbers
- **`rayLineIntersection(...)`**: Calculate ray-line segment intersections (used by art deco)
- **`distance(x1, y1, x2, y2)`**: Calculate Euclidean distance between points

**Pattern Helpers** (in `patternHelpers.ts`):
- **`setupPatternInset(...)`**: Sets up rotation, background fill, and clipping region
- **`drawGoldBorderLines(...)`**: Draws gold border lines at inset boundaries
- **`drawPatternWithBorders(...)`**: Wrapper combining both (less commonly used)

### useEffect Hook

Runs once on component mount to:
1. Pre-render all ribbons to off-screen canvases (`renderRibbonToCanvas()`)
2. Set main canvas dimensions (tarp + overhang)
3. Fill entire canvas with black background
4. Fill tarp area with dark grey background
5. Apply clipping to tarp area
6. Draw woven thread texture (clipped to tarp)
7. Restore clipping
8. Draw all ribbons on main canvas (with guide threads)
9. Draw individual ribbons on display canvases

## Development Notes

### Coordinate System
- Origin (0,0) is top-left
- Angles measured in degrees, converted to radians for canvas operations
- 0° is to the right (3 o'clock position)
- Angles increase clockwise
- Warp angle: 26.57° (lower-left to upper-right)
- Weft angle: 153.43° (upper-left to lower-right)

### Drawing Order (Critical for Visual Correctness)
1. Canvas backgrounds (black overhang, grey tarp)
2. Woven thread texture (clipped to tarp area)
3. Guide threads (all ribbons, clipped to tarp area)
4. Ribbon layers (bottom to top, as defined in config)
   - Each ribbon is pre-rendered with patterns, gold trim, and fraying
   - Then positioned/rotated and drawn on main canvas

### Canvas Size Limits
- Most browsers limit canvas dimensions to ~32,767 pixels per dimension
- At SCALE = 25: Longest ribbon (116 ft) = 34,800 px (EXCEEDS LIMIT)
- At SCALE = 16: Longest ribbon (116 ft) = 22,272 px (WITHIN LIMIT)
- Main canvas at SCALE = 16: 19,008 × 12,672 px (within limits)
- **Always verify SCALE doesn't cause ribbons to exceed browser limits**

### Performance Considerations
- High SCALE values create very large canvases
- Each thread (weave + guide) is drawn individually (900+ weave threads, 8 × 6 = 48 guide threads)
- Ribbons are pre-rendered once, then reused (efficient)
- Pattern rendering can be complex (especially interlocking rings with multiple passes)
- Consider reducing thread count or SCALE for development/testing
- Browser may struggle with SCALE > 20 due to canvas size and memory

### Color Palette
All color values are defined in `config.ts`. Key colors include:
- **Tarp background**: Dark grey (#222)
- **Overhang background**: Black (#000)
- **Weave threads**: Black (#000000)
- **Guide threads**: Dark grey (#404040)
- **Pattern colors**: Defined per ribbon segment
  - Common backgrounds: Various blues and greys
  - Common foreground: Gold (#dec573)

### Randomness and Reproducibility
- All random generation uses seeded random (`createSeededRandom()`)
- Main weave seed: 54321
- Guide threads: Seed = weave seed + (layerIndex × 1000)
- Fraying threads: Seed = weave seed + (ribbonIndex × 5000)
- **Same seed = same pattern** (reproducible renders)

### Testing and Debugging
- Use browser DevTools canvas inspector to examine rendering
- Check console for canvas size errors
- Reduce SCALE temporarily to speed up testing
- Comment out weave/guide threads to isolate ribbon rendering
- Individual ribbon canvases help verify ribbon appearance without transforms

## Architectural Constraints

### The Pre-Rendering Architecture
The current architecture uses off-screen canvas pre-rendering for critical reasons:

**Why Pre-Render?**
1. **Performance**: Render complex patterns once, reuse multiple times
2. **Consistency**: Guarantees individual ribbons match main tarp exactly
3. **Debugging**: Single rendering path = easier to find/fix issues
4. **Canvas Limits**: Allows rendering long ribbons that would exceed limits if rotated

**How It Works:**
```typescript
// Phase 1: Pre-render (once per ribbon)
const ribbonCanvas = renderRibbonToCanvas(layerIndex);
// Result: Complete ribbon with all effects, rendered horizontally

// Phase 2: Use pre-rendered canvas (multiple times)
// 2a. Main tarp - positioned and rotated
ctx.save();
ctx.translate(x, y);
ctx.rotate(angle);
ctx.drawImage(ribbonCanvas, 0, -ribbonWidth / 2);
ctx.restore();

// 2b. Individual display - direct copy
ctx.drawImage(ribbonCanvas, 0, 0);
```

**Critical Rules:**
1. ALL ribbon appearance is determined in `renderRibbonToCanvas()`
2. NEVER apply effects in `drawSingleRibbon()` or `drawIndividualRibbon()`
3. ONLY position/rotation transforms allowed outside pre-rendering
4. NEVER call pattern renderers, fraying, or gold trim outside `renderRibbonToCanvas()`

**What Happens If You Break These Rules:**
- Individual ribbons won't match main tarp
- Debugging becomes nightmare (which code path has the bug?)
- Changes require modifying multiple locations
- Subtle visual differences accumulate
- Print output won't match mockup

### Transform Hierarchy
When positioning ribbons on main canvas:
```typescript
ctx.save();
// 1. Translate to ribbon start position (where centerline begins)
ctx.translate(ribbonStartX, ribbonStartY);
// 2. Rotate to ribbon angle (warp or weft)
ctx.rotate(angleRad);
// 3. Draw ribbon canvas (centered on transform origin)
ctx.drawImage(ribbonCanvas, 0, -ribbonWidth / 2);
ctx.restore();
```

The ribbon's centerline starts at (ribbonStartX, ribbonStartY) and extends along its angle.

### Fraying Implementation Details
The fraying effect uses `destination-out` compositing instead of clipping:

**Why `destination-out`?**
- **Problem**: Using `clip()` with `evenodd` or `nonzero` rules causes overlapping triangles to toggle visibility
- **Solution**: `destination-out` erases pixels, so overlaps always erase (no toggle-back)

**Implementation:**
```typescript
ctx.save();
ctx.globalCompositeOperation = 'destination-out';
// Draw triangular shapes - they ERASE underlying pixels
for (const thread of threads) {
  ctx.beginPath();
  ctx.moveTo(-threadWidth * 2/3, -threadWidth * 2/3);
  ctx.lineTo(-threadWidth * 2/3, threadWidth * 2/3);
  ctx.lineTo(length, 0);
  ctx.closePath();
  ctx.fill(); // Erases a triangular section
}
ctx.restore();
```

**Triangle Geometry:**
- Base at thread start: width = 2/3 × threadWidth (~2 inches at SCALE 16)
- Point at thread end: extends random distance (30%-100% of fray zone)
- Aligned with ribbon angle (warp or weft)

## Future Enhancements

Potential areas for expansion:
- Interactive pattern selection/preview
- Pattern rotation controls
- Color customization UI
- Export to different formats/resolutions (PNG, PDF, SVG)
- Pattern density controls
- Multiple pattern combinations
- Real-time preview at different scales
- Print layout tools (alignment marks, crop marks)
- Measurement overlays (showing dimensions in feet/inches)
- 3D visualization of ribbon layering
- Animation showing ribbon assembly sequence

## File Location

`/Users/danmeehan/Stuff/Cap/cap_ruby/app/javascript/entrypoints/tarp_cc2_2026/index.tsx`

## Related Files

- View template: `/Users/danmeehan/Stuff/Cap/cap_ruby/app/views/tools/tarp_cc2_2026.html.erb`
- Route: Defined in `config/routes.rb`
