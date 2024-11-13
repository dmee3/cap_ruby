export const baseWaveFunc = (x: number, dotDensityX: number) => {
  return Math.sin((2 * Math.PI / dotDensityX) * x);
};

export const higherOrderWaveFunc = (
  x: number, wave1Amplitude: number, wave1Frequency: number, wave2Amplitude: number, wave2Frequency: number
) => {
  const waves = [
    wave1Amplitude * Math.sin(8 * wave1Frequency * x),
    wave2Amplitude * Math.cos(14 * wave2Frequency * x + Math.PI)
  ];
  return waves.reduce((acc, wave) => acc + wave, 0);
};
