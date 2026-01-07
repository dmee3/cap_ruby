/**
 * Shared utility functions for tarp pattern rendering
 */

/**
 * Seeded random number generator for reproducible patterns
 * @param seed - Initial seed value
 * @returns Function that generates pseudo-random numbers between 0 and 1
 */
export const createSeededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/**
 * Calculate intersection of a ray from a point with a line segment
 * @returns The intersection point or null if no intersection
 */
export const rayLineIntersection = (
  rayOriginX: number,
  rayOriginY: number,
  rayAngle: number, // Angle in radians
  lineX1: number,
  lineY1: number,
  lineX2: number,
  lineY2: number
): { x: number; y: number } | null => {
  // Ray direction
  const rayDx = Math.cos(rayAngle);
  const rayDy = Math.sin(rayAngle);

  // Line segment direction
  const lineDx = lineX2 - lineX1;
  const lineDy = lineY2 - lineY1;

  // Solve for intersection using parametric equations
  // Ray: P = rayOrigin + t * rayDir
  // Line: P = lineP1 + s * lineDir
  // where 0 <= s <= 1 for point to be on segment

  const denominator = rayDx * lineDy - rayDy * lineDx;
  if (Math.abs(denominator) < 0.0001) {
    // Lines are parallel
    return null;
  }

  const dx = lineX1 - rayOriginX;
  const dy = lineY1 - rayOriginY;

  const t = (dx * lineDy - dy * lineDx) / denominator;
  const s = (dx * rayDy - dy * rayDx) / denominator;

  // Check if intersection is in valid range (t > 0 for ray, 0 <= s <= 1 for segment)
  if (t >= 0 && s >= 0 && s <= 1) {
    return {
      x: rayOriginX + t * rayDx,
      y: rayOriginY + t * rayDy
    };
  }

  return null;
};

/**
 * Calculate Euclidean distance between two points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
