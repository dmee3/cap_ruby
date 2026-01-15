/**
 * Art Deco pattern renderer
 */

import { SCALE } from '../config';
import { rayLineIntersection, distance } from '../utils';
import type { DiamondVertex } from '../types';
import { setupPatternInset } from '../patternHelpers';

/**
 * Draw art deco pattern with geometric shapes and radial lines
 */
export const drawArtDecoPattern = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number, // Rotation angle of the pattern in degrees
  lineColor: string,
  backgroundColor: string,
  gridSize: number = 24, // Size of each tile in inches
  insetAmount: number = 0, // Inset from edges in pixels
) => {
  const { patternWidth, patternHeight } = setupPatternInset(
    ctx, x, y, width, height, angle, backgroundColor, insetAmount
  );

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = gridSize * 0.1;

  const gridSizePx = gridSize * SCALE;
  const spacing = gridSizePx * 1.5;
  const numCols = Math.ceil(patternWidth / spacing) + 2;
  const numRows = Math.ceil(patternHeight / spacing) + 2;

  // Pre-calculate spacing fractions to avoid repeated divisions
  const spacingHalf = spacing / 2;
  const spacingQuarter = spacing / 4;
  const rectHalfSize = spacingQuarter / 2;

  // Adjust inset to center pattern
  insetAmount += gridSizePx * 0.07;

  // Define gaps where we don't draw: 30-60, 120-150, 210-240, 300-330
  const isInGap = (angle: number): boolean => {
    return (angle > 30 && angle < 60) ||
      (angle > 120 && angle < 150) ||
      (angle > 210 && angle < 240) ||
      (angle > 300 && angle < 330);
  };

  // Draw all diagonal lines in one pass for better performance
  ctx.beginPath();
  for (let row = -1; row < numRows; row++) {
    for (let col = -1; col < numCols - 1; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing;
      const nextCenterX = (col + 1) * spacing;
      const nextCenterY = insetAmount + (row + 1) * spacing;
      const prevCenterX = (col - 1) * spacing;

      // Diagonal down-right
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nextCenterX, nextCenterY);

      // Diagonal down-left
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(prevCenterX, nextCenterY);
    }
  }
  ctx.stroke();

  // Draw patterns at each grid point
  for (let row = -1; row < numRows; row++) {
    for (let col = -1; col < numCols - 1; col++) {
      const centerX = col * spacing;
      const centerY = insetAmount + row * spacing;

      // Small rectangles at diagonal intersections
      const intersectionX = centerX + spacingHalf;
      const intersectionY = centerY + spacingHalf;
      ctx.strokeRect(
        intersectionX - rectHalfSize,
        intersectionY - rectHalfSize,
        spacingQuarter,
        spacingQuarter
      );

      // Small diamonds
      // ctx.beginPath();
      // ctx.moveTo(centerX, centerY + spacingThird);
      // ctx.lineTo(centerX + spacingThird, centerY);
      // ctx.lineTo(centerX, centerY - spacingThird);
      // ctx.lineTo(centerX - spacingThird, centerY);
      // ctx.closePath();
      // ctx.stroke();

      // Large diamond vertices
      const topVertex: DiamondVertex = { x: centerX, y: centerY - spacingHalf };
      const rightVertex: DiamondVertex = { x: centerX + spacingHalf, y: centerY };
      const bottomVertex: DiamondVertex = { x: centerX, y: centerY + spacingHalf };
      const leftVertex: DiamondVertex = { x: centerX - spacingHalf, y: centerY };

      // Diamond edges for intersection calculations
      const diamondEdges = [
        { x1: topVertex.x, y1: topVertex.y, x2: rightVertex.x, y2: rightVertex.y, v1: topVertex, v2: rightVertex },
        { x1: rightVertex.x, y1: rightVertex.y, x2: bottomVertex.x, y2: bottomVertex.y, v1: rightVertex, v2: bottomVertex },
        { x1: bottomVertex.x, y1: bottomVertex.y, x2: leftVertex.x, y2: leftVertex.y, v1: bottomVertex, v2: leftVertex },
        { x1: leftVertex.x, y1: leftVertex.y, x2: topVertex.x, y2: topVertex.y, v1: leftVertex, v2: topVertex }
      ];

      // Draw radial lines at 15-degree intervals
      for (let angleDeg = 0; angleDeg < 360; angleDeg += 15) {
        if (isInGap(angleDeg) || angleDeg % 90 === 0) continue;

        const angleRad = angleDeg * Math.PI / 180;
        const is45DegreeAngle = angleDeg % 45 === 0;

        // Find closest intersection with diamond edges
        let closestIntersection: { x: number; y: number; vertex: DiamondVertex } | null = null;
        let closestDistance = Infinity;

        for (const edge of diamondEdges) {
          const intersection = rayLineIntersection(
            centerX, centerY, angleRad,
            edge.x1, edge.y1, edge.x2, edge.y2
          );

          if (intersection) {
            const dist = distance(centerX, centerY, intersection.x, intersection.y);
            if (dist < closestDistance) {
              closestDistance = dist;

              // Determine which vertex is closer to the intersection
              const distToV1 = distance(intersection.x, intersection.y, edge.v1.x, edge.v1.y);
              const distToV2 = distance(intersection.x, intersection.y, edge.v2.x, edge.v2.y);
              const nearestVertex = distToV1 < distToV2 ? edge.v1 : edge.v2;

              closestIntersection = { ...intersection, vertex: nearestVertex };
            }
          }
        }

        if (closestIntersection) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(closestIntersection.x, closestIntersection.y);

          if (!is45DegreeAngle) {
            // For non-45° angles: complete the triangle
            ctx.lineTo(closestIntersection.vertex.x, closestIntersection.vertex.y);
            ctx.closePath();
          }

          ctx.stroke();
        }
      }
    }
  }

  ctx.restore();
};
