/**
 * Pattern drawing helpers
 * Common logic for drawing patterns with insets and borders
 */

import { SCALE } from './config';

/**
 * Wrapper that handles common pattern drawing setup:
 * - Rotation and transformation
 * - Background fill
 * - Inset clipping region
 * - Calls pattern drawing function
 * - Draws gold border lines
 */
export const drawPatternWithBorders = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
  backgroundColor: string,
  insetAmount: number,
  patternDrawFn: (ctx: CanvasRenderingContext2D) => void
) => {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  // Fill background color first (full width and height)
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Create a clipping region with inset for pattern drawing
  const patternWidth = width;
  const patternHeight = height - (2 * insetAmount);
  ctx.beginPath();
  ctx.rect(0, insetAmount, patternWidth, patternHeight);
  ctx.clip();

  // Call the actual pattern drawing function
  patternDrawFn(ctx);

  ctx.restore();

  // Draw gold border lines (2" outer gutter, 1.5" gold line, 1.5" inner gutter for pattern)
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  ctx.fillStyle = '#dec573'; // Gold color
  const lineWidth = 1.5 * SCALE; // 1.5 inches
  const lineOffset = 2 * SCALE; // 2 inches from edge

  // Top gold line (2" from top edge, 1.5" tall)
  ctx.fillRect(0, lineOffset, width, lineWidth);

  // Bottom gold line (2" from bottom edge, 1.5" tall)
  ctx.fillRect(0, height - lineOffset - lineWidth, width, lineWidth);

  ctx.restore();
};

/**
 * Setup for pattern drawing with inset (common transformation and clipping logic)
 * Use this when you need more control and want to handle gold lines separately
 */
export const setupPatternInset = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
  backgroundColor: string,
  insetAmount: number,
  insetAllSides: boolean = false
): { patternWidth: number; patternHeight: number } => {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  // Fill background color first (full width and height)
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Create a clipping region with inset for pattern drawing
  if (insetAllSides) {
    // Inset on all four sides
    const patternWidth = width - (2 * insetAmount);
    const patternHeight = height - (2 * insetAmount);
    ctx.beginPath();
    ctx.rect(insetAmount, insetAmount, patternWidth, patternHeight);
    ctx.clip();
    return { patternWidth, patternHeight };
  } else {
    // Original behavior: only inset top/bottom
    const patternWidth = width;
    const patternHeight = height - (2 * insetAmount);
    ctx.beginPath();
    ctx.rect(0, insetAmount, patternWidth, patternHeight);
    ctx.clip();
    return { patternWidth, patternHeight };
  }
};

/**
 * Draw gold border lines at the inset boundaries
 */
export const drawGoldBorderLines = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
  allSides: boolean = false,
  lineWidthMultiplier: number = 1
) => {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-width / 2, -height / 2);

  ctx.fillStyle = '#dec573'; // Gold color
  const lineWidth = 1.5 * SCALE * lineWidthMultiplier; // 1.5 inches (scaled by multiplier)
  const lineOffset = 2 * SCALE * lineWidthMultiplier; // 2 inches from edge (scaled by multiplier)

  if (allSides) {
    // When drawing all sides, cut lines at corners to form a clean rectangle
    // Top gold line (cuts off at the corners)
    ctx.fillRect(lineOffset + lineWidth, lineOffset, width - 2 * (lineOffset + lineWidth), lineWidth);

    // Bottom gold line (cuts off at the corners)
    ctx.fillRect(lineOffset + lineWidth, height - lineOffset - lineWidth, width - 2 * (lineOffset + lineWidth), lineWidth);

    // Left gold line (full height)
    ctx.fillRect(lineOffset, lineOffset, lineWidth, height - 2 * lineOffset);

    // Right gold line (full height)
    ctx.fillRect(width - lineOffset - lineWidth, lineOffset, lineWidth, height - 2 * lineOffset);
  } else {
    // Original behavior for top/bottom only (spans full width)
    // Top gold line (2" from top edge, 1.5" tall)
    ctx.fillRect(0, lineOffset, width, lineWidth);

    // Bottom gold line (2" from bottom edge, 1.5" tall)
    ctx.fillRect(0, height - lineOffset - lineWidth, width, lineWidth);
  }

  ctx.restore();
};
