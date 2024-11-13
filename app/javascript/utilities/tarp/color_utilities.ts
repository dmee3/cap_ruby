export const hexToRgb = (hex: string): [number, number, number] => {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Parse the r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return [r, g, b];
};

export const getColorAtPoint = (gradient: CanvasGradient, point: number, height: number): string => {
  // Create a temporary canvas to draw the gradient
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1;
  tempCanvas.height = height; // Height can be any value, we just need a vertical gradient
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('Could not get 2D context');
  }

  // Draw the gradient on the temporary canvas
  tempCtx.fillStyle = gradient;
  tempCtx.fillRect(0, 0, 1, height);

  // Get the color at the specified point
  const y = Math.floor(point * (height - 1)); // Convert point to a y-coordinate
  const imageData = tempCtx.getImageData(0, y, 1, 1).data;

  // Convert the color to a CSS rgb string
  const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
  return color;
};

export const interpolateColor = (startColor: number[], endColor: number[], factor: number) => {
  const result = startColor.slice();
  for (let i = 0; i < startColor.length; i++) {
    result[i] = Math.round(result[i] + factor * (endColor[i] - startColor[i]));
  }
  return result;
};
