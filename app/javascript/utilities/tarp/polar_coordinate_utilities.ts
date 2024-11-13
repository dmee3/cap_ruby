export const polarToCartesian = (centerX: number, centerY: number, r: number, theta: number) => {
  const x = centerX + r * Math.cos(theta);
  const y = centerY + r * Math.sin(theta);
  return { x, y };
};

export const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

export const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);
