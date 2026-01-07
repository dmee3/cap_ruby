/**
 * Octagon pattern renderer
 */

import { SCALE } from '../config';
import { setupPatternInset } from '../patternHelpers';

/**
 * Draw octagon pattern
 */
export const drawOctagons = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number, // Rotation angle of the pattern in degrees
  octagonColor: string,
  backgroundColor: string,
  octagonSize: number = 8, // Size of each octagon in inches
  insetAmount: number = 0, // Inset from edges in pixels
) => {
  const { patternWidth, patternHeight } = setupPatternInset(
    ctx, x, y, width, height, angle, backgroundColor, insetAmount
  );

  const octagonSizePx = octagonSize * SCALE;
  const spacing = octagonSizePx * 1.6;

  const numCols = Math.ceil(patternWidth / spacing) + 2;
  const numRows = Math.ceil(patternHeight / spacing) + 2;

  ctx.strokeStyle = octagonColor;
  ctx.lineWidth = octagonSizePx * 0.08;
  const yOffset = octagonSize * 0.5;

  // Draw horizontal connecting lines (octagon to octagon to the right)
  for (let row = -1; row < numRows; row++) {
    for (let col = -1; col < numCols - 1; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing + yOffset;
      const nextCenterX = (col + 1) * spacing;

      const size = octagonSizePx / 2;

      // Line from right edge of current octagon to left edge of next octagon
      ctx.beginPath();
      ctx.moveTo(centerX + size, centerY);
      ctx.lineTo(nextCenterX - size, centerY);
      ctx.stroke();
    }
  }

  // Draw vertical connecting lines (octagon to octagon below)
  for (let row = -1; row < numRows - 1; row++) {
    for (let col = -1; col < numCols; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing + yOffset;
      const nextCenterY = insetAmount + (row + 1) * spacing + yOffset;

      const size = octagonSizePx / 2;

      // Line from bottom edge of current octagon to top edge of next octagon
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + size);
      ctx.lineTo(centerX, nextCenterY - size);
      ctx.stroke();
    }
  }

  // LAYER 3: Draw octagons at full opacity
  ctx.strokeStyle = octagonColor;
  ctx.lineWidth = octagonSizePx * 0.08;

  // Draw octagons in a grid pattern
  for (let row = -1; row < numRows; row++) {
    for (let col = -1; col < numCols; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing + yOffset;

      // Draw octagon with horizontal/vertical sides longer than diagonal sides
      const size = octagonSizePx / 2;
      const longSide = size * 0.25;

      ctx.beginPath();
      // Start at top, go clockwise
      // Top edge
      ctx.moveTo(centerX - longSide, centerY - size);
      ctx.lineTo(centerX + longSide, centerY - size);
      // Top-right corner
      ctx.lineTo(centerX + size, centerY - longSide);
      // Right edge
      ctx.lineTo(centerX + size, centerY + longSide);
      // Bottom-right corner
      ctx.lineTo(centerX + longSide, centerY + size);
      // Bottom edge
      ctx.lineTo(centerX - longSide, centerY + size);
      // Bottom-left corner
      ctx.lineTo(centerX - size, centerY + longSide);
      // Left edge
      ctx.lineTo(centerX - size, centerY - longSide);
      // Top-left corner (back to start)
      ctx.closePath();
      ctx.stroke();
    }
  }

  ctx.restore();
};
