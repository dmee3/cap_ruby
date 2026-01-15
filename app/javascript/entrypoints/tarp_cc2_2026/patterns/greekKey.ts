/**
 * Greek key pattern renderer
 */

import { SCALE } from '../config';
import { setupPatternInset } from '../patternHelpers';

/**
 * Draw a single Greek key unit
 */
const drawGreekKeyUnit = (
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  patternSize: number
) => {
  ctx.save();
  // Square outline
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

/**
 * Draw Greek key pattern
 */
export const drawGreekKey = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number, // Rotation angle of the pattern in degrees
  color1: string,
  backgroundColor: string,
  keySize: number = 8, // Size of each key unit in inches
  insetAmount: number = 0, // Inset from edges in pixels
) => {
  const { patternWidth, patternHeight } = setupPatternInset(
    ctx, x, y, width, height, angle, backgroundColor, insetAmount
  );

  const patternSize = keySize * SCALE;

  ctx.lineWidth = SCALE * 1.6;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.strokeStyle = color1;

  let rowIndex = 0;
  let baseY = insetAmount - patternSize * 1.71;
  while (baseY < insetAmount + patternHeight + 1) {
    // Offset every other row by half a pattern width
    const xOffset = (rowIndex % 2 === 1) ? patternSize / 2 : 0;
    let baseX = insetAmount + xOffset - patternSize; // Start one pattern to the left

    while (baseX < insetAmount + patternWidth + patternSize) { // Draw a bit beyond edge to handle offset
      drawGreekKeyUnit(ctx, baseX, baseY, patternSize);
      baseX += patternSize;
    }

    baseY += patternSize * 7 / 8;
    rowIndex++;
  }

  ctx.restore();
};
