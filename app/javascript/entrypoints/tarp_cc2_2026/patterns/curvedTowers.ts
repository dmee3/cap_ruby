/**
 * Curved towers pattern renderer
 */

import { SCALE } from '../config';
import { setupPatternInset } from '../patternHelpers';

// Constants for sub-line positions relative to line spacing
const SUBLINE_1_POSITION = 0.5; // Between lines 0 and 1
const SUBLINE_2_POSITION = 2.5; // Between lines 2 and 3

/**
 * Calculate horizontal intersection of a line with a circle
 * @param lineY - Y position of horizontal line
 * @param circleCenterY - Y position of circle center
 * @param radius - Circle radius
 * @returns Distance from circle center to intersection point (horizontal)
 */
const getCircleIntersectionDx = (
  lineY: number,
  circleCenterY: number,
  radius: number
): number => {
  const dy = lineY - circleCenterY;
  return Math.sqrt(radius * radius - dy * dy);
};

/**
 * Draw horizontal lines
 */
const drawHorizontalLines = (
  ctx: CanvasRenderingContext2D,
  tileWidth: number,
  lineSpacingPx: number,
  startX: number,
  startY: number
) => {
  for (let i = 1; i <= 4; i++) {
    const yPos = startY + lineSpacingPx * i;
    ctx.beginPath();
    ctx.moveTo(startX, yPos);
    ctx.lineTo(startX + tileWidth, yPos);
    ctx.stroke();
  }
};

/**
 * Get tower component positions
 */
const getTowerPositions = (
  xPos: number,
  startLine: number,
  lineSpacingPx: number,
  radius: number
) => {
  return {
    topCapY: (startLine + 1) * lineSpacingPx,
    bodyY: (startLine + 2) * lineSpacingPx,
    bottomCapY: (startLine + 3) * lineSpacingPx,
    topCapQuarter1X: xPos,
    topCapQuarter2X: xPos - radius,
    bodyHalfX: xPos - 2 * radius,
    bottomCapQuarter1X: xPos,
    bottomCapQuarter2X: xPos - radius,
  };
};

/**
 * Draw a tower out of curves
 * @param xPos - X position of the tower's right edge
 * @param startLine - Which line to start from (0 = top edge, 1-4 = lines)
 * @param startY - Y offset for the tile
 */
const drawTower = (
  ctx: CanvasRenderingContext2D,
  xPos: number,
  startLine: number,
  lineSpacingPx: number,
  radius: number,
  tileWidth: number,
  startY: number
) => {
  const pos = getTowerPositions(xPos, startLine, lineSpacingPx, radius);

  // Top cap
  // First quarter circle at the right edge
  ctx.beginPath();
  ctx.arc(pos.topCapQuarter1X, startY + pos.topCapY, radius, Math.PI, Math.PI * 1.5, false);
  ctx.stroke();

  // Second quarter circle, one radius to the left
  ctx.beginPath();
  ctx.arc(pos.topCapQuarter2X, startY + pos.topCapY, radius, Math.PI, Math.PI * 1.5, false);
  ctx.stroke();

  // Body (half circle)
  ctx.beginPath();
  ctx.arc(pos.bodyHalfX, startY + pos.bodyY, radius, Math.PI * 1.5, Math.PI * 0.5, true);
  ctx.stroke();

  // Bottom cap
  // First quarter circle at the right edge
  ctx.beginPath();
  ctx.arc(pos.bottomCapQuarter1X, startY + pos.bottomCapY, radius, Math.PI * 0.5, Math.PI, false);
  ctx.stroke();

  // Second quarter circle, one radius to the left
  ctx.beginPath();
  ctx.arc(pos.bottomCapQuarter2X, startY + pos.bottomCapY, radius, Math.PI * 0.5, Math.PI, false);
  ctx.stroke();
};


/**
 * Draw a single tile of the pattern
 */
const drawSingleTile = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  tileWidth: number,
  lineSpacingPx: number,
  radius: number
) => {
  // Tower positions relative to tile
  const tower1X = startX + tileWidth;
  const tower2X = startX + tileWidth / 2;
  const tower3X = startX + tileWidth / 2;

  // Draw all components for this tile
  drawHorizontalLines(ctx, tileWidth, lineSpacingPx, startX, startY);
  drawTower(ctx, tower1X, 0, lineSpacingPx, radius, tileWidth, startY);
  drawTower(ctx, tower2X, 2, lineSpacingPx, radius, tileWidth, startY);
  drawTower(ctx, tower3X, -2, lineSpacingPx, radius, tileWidth, startY);

  // Get tower positions for calculations
  const tower1Pos = getTowerPositions(tower1X, 0, lineSpacingPx, radius);
  const tower2Pos = getTowerPositions(tower2X, 2, lineSpacingPx, radius);
  const tower3Pos = getTowerPositions(tower3X, -2, lineSpacingPx, radius);

  // Draw sub-line between lines 2 and 3 (from right edge to tower1)
  const subLineY1 = startY + SUBLINE_2_POSITION * lineSpacingPx;
  const dx1 = getCircleIntersectionDx(SUBLINE_2_POSITION * lineSpacingPx, tower1Pos.bodyY, radius);
  const intersectionX1 = tower1Pos.bodyHalfX - dx1;

  ctx.beginPath();
  ctx.moveTo(startX + tileWidth, subLineY1);
  ctx.lineTo(intersectionX1, subLineY1);
  ctx.stroke();

  // Draw sub-line between lines 2 and 3 (from tower2 to left edge)
  const dx1Tower2 = getCircleIntersectionDx(SUBLINE_2_POSITION * lineSpacingPx, tower2Pos.topCapY, radius);
  const intersectionX1Tower2 = tower2Pos.topCapQuarter2X - dx1Tower2;

  ctx.beginPath();
  ctx.moveTo(intersectionX1Tower2, subLineY1);
  ctx.lineTo(startX, subLineY1);
  ctx.stroke();

  // Draw sub-line between lines 0 and 1
  const subLineY2 = startY + SUBLINE_1_POSITION * lineSpacingPx;
  const dx2Half = getCircleIntersectionDx(SUBLINE_1_POSITION * lineSpacingPx, tower3Pos.bodyY, radius);
  const intersectionX2Half = tower3Pos.bodyHalfX - dx2Half;

  const dx2Quarter = getCircleIntersectionDx(SUBLINE_1_POSITION * lineSpacingPx, tower1Pos.topCapY, radius);
  const intersectionX2Quarter = tower1Pos.topCapQuarter2X - dx2Quarter;

  ctx.beginPath();
  ctx.moveTo(intersectionX2Half, subLineY2);
  ctx.lineTo(intersectionX2Quarter, subLineY2);
  ctx.stroke();
};

/**
 * Draw curved towers pattern with evenly spaced horizontal lines and semicircular arcs
 */
export const drawCurvedTowers = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number, // Rotation angle of the pattern in degrees
  lineColor: string,
  backgroundColor: string,
  tileSize: number = 32, // Total height of one repeating tile in inches
  insetAmount: number = 0, // Inset from edges in pixels
) => {
  const { patternWidth, patternHeight } = setupPatternInset(
    ctx, x, y, width, height, angle, backgroundColor, insetAmount
  );

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = SCALE; // 1 inch line width

  // Calculate spacing between lines (4 lines within tileSize)
  const lineSpacing = tileSize / 4;
  const lineSpacingPx = lineSpacing * SCALE;
  const tileSizePx = tileSize * SCALE;
  const tileWidth = 2 * tileSizePx;
  const tileHeight = 4 * lineSpacingPx;
  const radius = lineSpacingPx;

  // Calculate how many tiles we need to cover the pattern area (with inset applied)
  const numTilesX = Math.ceil(patternWidth / tileWidth) + 1;
  const numTilesY = Math.ceil(patternHeight / tileHeight) + 1;

  // Draw tiled pattern (offset by inset amount)
  for (let tileY = -1; tileY < numTilesY; tileY++) {
    for (let tileX = -1; tileX < numTilesX; tileX++) {
      const startX = tileX * tileWidth;
      const startY = insetAmount + tileY * tileHeight;

      drawSingleTile(ctx, startX, startY, tileWidth, lineSpacingPx, radius);
    }
  }

  ctx.restore();
};
