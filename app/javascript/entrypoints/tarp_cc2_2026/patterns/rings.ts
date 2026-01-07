/**
 * Interlocking rings pattern renderer
 */

import { SCALE } from '../config';
import { setupPatternInset } from '../patternHelpers';

/**
 * Draw interlocking rings pattern
 */
export const drawInterlockingRings = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number, // Rotation angle of the pattern in degrees
  ringColor: string,
  backgroundColor: string,
  ringRadius: number = 6, // Radius of each ring in inches
  insetAmount: number = 0, // Inset from edges in pixels
) => {
  const { patternWidth, patternHeight } = setupPatternInset(
    ctx, x, y, width, height, angle, backgroundColor, insetAmount
  );

  // Adjust inset to center pattern vertically
  insetAmount += ringRadius * SCALE * 0.3;

  const ringRadiusPx = ringRadius * SCALE;
  const spacing = ringRadiusPx * 1.6; // Distance between ring centers

  const numCols = Math.ceil(patternWidth / spacing) + 2;
  const numRows = Math.ceil(patternHeight / spacing) + 2;

  for (let row = -1; row < numRows; row++) {
    for (let col = -1; col < numCols; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing - ringRadius * 1.5;

      // Draw ring
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = SCALE * 1.6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadiusPx, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
};
