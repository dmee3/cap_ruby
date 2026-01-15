/**
 * Woven thread texture renderer
 */

import { SCALE, CONFIG } from '../config';
import { createSeededRandom } from '../utils';

/**
 * Draw a single thread with tapered ends
 */
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

    // Taper: width is 0 at ends (t=0, t=1) and maxWidth at center (t=0.5)
    // Using a sine wave for smooth tapering
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

/**
 * Draw woven thread texture
 */
export const drawWeave = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const random = createSeededRandom(CONFIG.weave.seed);

  const warpAngleRad = (CONFIG.weave.warpThreads.angle * Math.PI) / 180;
  const weftAngleRad = (CONFIG.weave.weftThreads.angle * Math.PI) / 180;

  // Generate warp thread positions
  // Use seeded random to position thread centers across the entire canvas
  const warpThreads: Array<{ x: number; y: number; length: number; index: number }> = [];

  for (let i = 0; i < CONFIG.weave.warpThreads.count; i++) {
    // Random position across entire canvas (with margin for threads extending beyond)
    const x = random() * width * 1.2 - width * 0.1; // 120% width centered
    const y = random() * height * 1.2 - height * 0.1; // 120% height centered

    // Random length for threadbare effect
    const lengthInches = CONFIG.weave.warpThreads.minLength +
      random() * (CONFIG.weave.warpThreads.maxLength - CONFIG.weave.warpThreads.minLength);
    const length = lengthInches * SCALE;

    warpThreads.push({ x, y, length, index: i });
  }

  // Generate weft thread positions
  // Use seeded random to position thread centers across the entire canvas
  const weftThreads: Array<{ x: number; y: number; length: number; index: number }> = [];

  for (let i = 0; i < CONFIG.weave.weftThreads.count; i++) {
    // Random position across entire canvas (with margin for threads extending beyond)
    const x = random() * width * 1.2 - width * 0.1; // 120% width centered
    const y = random() * height * 1.2 - height * 0.1; // 120% height centered

    const lengthInches = CONFIG.weave.weftThreads.minLength +
      random() * (CONFIG.weave.weftThreads.maxLength - CONFIG.weave.weftThreads.minLength);
    const length = lengthInches * SCALE;

    weftThreads.push({ x, y, length, index: i });
  }
  ctx.fillStyle = CONFIG.colors.threads;
  ctx.globalAlpha = CONFIG.weave.opacity;

  // Draw warp threads
  for (const warp of warpThreads) {
    const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.variation.thicknessVariation;
    const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

    drawThread(ctx, warp.x, warp.y, warp.length, warpAngleRad, threadWidth);
  }

  // Draw weft threads
  for (const weft of weftThreads) {
    const thicknessVar = 1 + (random() - 0.5) * CONFIG.weave.variation.thicknessVariation;
    const threadWidth = CONFIG.weave.baseWidth * SCALE * thicknessVar;

    drawThread(ctx, weft.x, weft.y, weft.length, weftAngleRad, threadWidth);
  }

  // Reset global alpha
  ctx.globalAlpha = 1.0;
};
