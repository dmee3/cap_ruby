import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'
import InputNumber from '../../react/components/inputs/InputNumber';
import { getColorAtPoint, hexToRgb } from '../../utilities/tarp/color_utilities';
import { baseWaveFunc, higherOrderWaveFunc } from '../../utilities/tarp/wave_utilities';
import { drawEqualizerHorizontal } from '../../utilities/tarp/morse_utilities';

const SCALE_FACTOR = 1;

const Tarp = () => {

  const CANVAS_WIDTH = 3000 * SCALE_FACTOR;
  const CANVAS_HEIGHT = 1600 * SCALE_FACTOR;


  const [wave1Frequency, setWave1Frequency] = useState(.7);
  const [wave1Amplitude, setWave1Amplitude] = useState(60 * SCALE_FACTOR);
  const [wave2Frequency, setWave2Frequency] = useState(.4);
  const [wave2Amplitude, setWave2Amplitude] = useState(44 * SCALE_FACTOR);
  const [waveOffset, setWaveOffset] = useState(350 * SCALE_FACTOR);
  const [centerGapRadius, setCenterGapRadius] = useState(75 * SCALE_FACTOR);
  const [dotDensityX, setDotDensityX] = useState(120);
  const [dotDensityY, setDotDensityY] = useState(30);
  const [dotBaseRadius, setDotBaseRadius] = useState(12 * SCALE_FACTOR);

  // Colors
  const GRADIENT_START_COLOR = `rgb(${hexToRgb('#19071c').join(',')})`;
  const GRADIENT_END_COLOR = `rgb(${hexToRgb('#19071c').join(',')})`;

  const drawGradientBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    grad.addColorStop(0, GRADIENT_START_COLOR);
    grad.addColorStop(1, GRADIENT_END_COLOR);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const drawCircle = (ctx, sineYOffset, circle) => {
    const waveY = sineYOffset + higherOrderWaveFunc(circle.theta, wave1Amplitude, wave1Frequency, wave2Amplitude, wave2Frequency);
    let adjustedRadius = circle.radius;
    ctx.beginPath();
    if (circle.r > waveY) {
      const distanceFromWave = Math.abs(circle.r - waveY);
      adjustedRadius = adjustedRadius * Math.exp(-distanceFromWave / (150 * SCALE_FACTOR));
      if (adjustedRadius < 0.5 * SCALE_FACTOR) {
        return;
      }
    }
    ctx.arc(circle.x, circle.y, adjustedRadius, 0, 2 * Math.PI);
    ctx.fillStyle = circle.color;
    ctx.fill();
  };

  const drawArc = (ctx, arc, sineYOffset, centerGapRadius, baseCircleRadius) => {
    const baseCircleDiameter = baseCircleRadius * 2;
    const circleArray = [];
    for (let j = 0; j < dotDensityY; j++) {
      const subArray = [];
      const factor = j / (dotDensityY - 1);
      const arcSpacing = 2;
      const color = getColorAtPoint(arc.gradient, factor, CANVAS_HEIGHT);

      for (let i = 0; i < dotDensityX; i++) {
        const angle = (i / dotDensityX) * 2 * Math.PI;
        const radius = centerGapRadius + arcSpacing * j * baseCircleDiameter + baseWaveFunc(i, dotDensityX) * baseCircleDiameter + 20 * j;
        const circleRadius = baseCircleRadius + 2 * baseWaveFunc(i, dotDensityX) - (dotDensityY / 2 - j) * 0.001;
        const xPos = arc.centerX + radius * Math.cos(angle);
        const yPos = arc.centerY + radius * Math.sin(angle);

        const circle = {
          radius: circleRadius,
          color: color,
          r: radius,
          theta: angle,
          x: xPos,
          y: yPos
        };
        subArray.push(circle);
      }
      circleArray.push(subArray);
    }

    for (let j = 0; j < dotDensityY; j++) {
      for (let i = 0; i < dotDensityX; i++) {
        const circle = circleArray[j][i];
        drawCircle(ctx, sineYOffset, circle);
      }
    }
  }

  useEffect(() => {
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGradientBackground(ctx);

    // const orangeGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // orangeGrad.addColorStop(0, '#d75e4d');
    // orangeGrad.addColorStop(0.5, '#734248');
    // orangeGrad.addColorStop(1, '#0c3642');

    // const redGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // redGrad.addColorStop(0, '#ed6f9b');
    // redGrad.addColorStop(0.5, '#d94848');
    // redGrad.addColorStop(1, '#4f2d6f');

    // const yellowGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // yellowGrad.addColorStop(0, '#ffd87f');
    // yellowGrad.addColorStop(0.5, '#f58d56');
    // yellowGrad.addColorStop(1, '#3f5548');

    // const tealGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // tealGrad.addColorStop(0, '#00edd3');
    // tealGrad.addColorStop(0.5, '#127cb8');
    // tealGrad.addColorStop(1, '#0b4f66');

    // const tealGradNew = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // tealGradNew.addColorStop(0, '#09efd4');
    // tealGradNew.addColorStop(0.5, '#006661');
    // tealGradNew.addColorStop(1, '#2e0f38');

    // const purpleGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // purpleGrad.addColorStop(0, '#b45dbb');
    // purpleGrad.addColorStop(0.5, '#8351a8');
    // purpleGrad.addColorStop(1, '#2e0f38');

    // const orangeGradNew = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // orangeGradNew.addColorStop(0, '#f8b10f');
    // orangeGradNew.addColorStop(0.5, '#b44e1b');
    // orangeGradNew.addColorStop(1, '#7a3018');

    // const pinkGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    // pinkGrad.addColorStop(0, '#ec1dbd');
    // pinkGrad.addColorStop(0.5, '#a12585');
    // pinkGrad.addColorStop(1, '#5b273d');

    const pinkFoilGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    pinkFoilGrad.addColorStop(0, '#e42c7e');
    pinkFoilGrad.addColorStop(0.5, '#a12585');
    pinkFoilGrad.addColorStop(1, '#5b273d');

    const blueFoilGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    blueFoilGrad.addColorStop(0, '#27b5d1');
    blueFoilGrad.addColorStop(0.5, '#006661');
    blueFoilGrad.addColorStop(1, '#2e0f38');

    const orangeFoilGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    orangeFoilGrad.addColorStop(0, '#e37f4d');
    orangeFoilGrad.addColorStop(0.5, '#b44e1b');
    orangeFoilGrad.addColorStop(1, '#7a3018');

    const yellowFoilGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    yellowFoilGrad.addColorStop(0, '#f7c93c');
    yellowFoilGrad.addColorStop(0.5, '#f58d56');
    yellowFoilGrad.addColorStop(1, '#3f5548');

    const arcs = [
      { centerX: 0, centerY: 0, gradient: orangeFoilGrad },
      { centerX: CANVAS_WIDTH, centerY: 0, gradient: blueFoilGrad },
      { centerX: CANVAS_WIDTH, centerY: CANVAS_HEIGHT, gradient: yellowFoilGrad },
      { centerX: 0, centerY: CANVAS_HEIGHT, gradient: pinkFoilGrad }
    ]

    for (let i = 0; i < arcs.length; i++) {
      drawArc(ctx, arcs[i], waveOffset + 200, 0, dotBaseRadius);
    };

    const morseArray = [
      '.',
      'l..',
      ' ..',
      '. ...l',
      '.d... ',
      '.l.l.d. .',
      '. . .d.l.',
      ' . .d. ',
      '..d.l.d. ..',
      '.l. .....',
      ' . .d.d',
      '... .........',
      '....d.l.d.d....',
      '...... .l.d....',
      '.....d. . .l.....',
      '...l.l. . ...',
      '. . ... .',
      '. . .d.l.',
      '.l.l.',
      '..l. . . ..',
      '.. . . .d..',
      '...d.d',
      'd.d....',
      '.d...',
      'l..',
      '..',
      '.',
      '.'
    ];

    const morseSpacing = 70 * SCALE_FACTOR;
    const morseStartX = CANVAS_WIDTH / 2 - .5 * morseSpacing * morseArray.length;
    const morseBaseY = CANVAS_HEIGHT / 2;
    const morseDotRadius = 24 * SCALE_FACTOR;
    const morseBaseColor = '#2e0f38';
    const morseHighlightColor = '#8351a8';

    drawEqualizerHorizontal(ctx, morseArray, morseStartX, morseBaseY, morseSpacing, morseDotRadius, morseBaseColor, morseHighlightColor);

  }, [wave1Amplitude, wave1Frequency, wave2Amplitude, wave2Frequency, waveOffset, centerGapRadius, dotDensityX, dotDensityY, dotBaseRadius]);

  return (
    <div>
      <div className="flex flex-row mb-10">
        <div className="grid grid-cols-5 mb-4 gap-x-4 w-200">
          <div className="flex flex-col">
            <div className="flex flex-col">
              <label htmlFor="wave_1_frequency" className="input-label">Wave 1 Frequency</label>
              <InputNumber
                name='wave_1_frequency'
                value={wave1Frequency}
                min={0.1}
                step={0.1}
                onChange={evt => setWave1Frequency(parseFloat(evt.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="wave_1_amplitude" className="input-label">Wave 1 Amplitude</label>
              <InputNumber
                name='wave_1_amplitude'
                min={1}
                value={wave1Amplitude}
                onChange={evt => setWave1Amplitude(parseInt(evt.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col">
              <label htmlFor="wave_2_frequency" className="input-label">Wave 2 Frequency</label>
              <InputNumber
                name='wave_2_frequency'
                value={wave2Frequency}
                min={0.1}
                step={0.1}
                onChange={evt => setWave2Frequency(parseFloat(evt.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="wave_2_amplitude" className="input-label">Wave 2 Amplitude</label>
              <InputNumber
                name='wave_2_amplitude'
                min={1}
                value={wave2Amplitude}
                onChange={evt => setWave2Amplitude(parseInt(evt.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col">
              <label htmlFor="wave_offset" className="input-label">Wave Offset</label>
              <InputNumber
                name='wave_offset'
                value={waveOffset}
                min={100}
                step={1}
                onChange={evt => setWaveOffset(parseInt(evt.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="center_gap_radius" className="input-label">Center Gap Radius</label>
              <InputNumber
                name='center_gap_radius'
                value={centerGapRadius}
                min={100}
                step={1}
                onChange={evt => setCenterGapRadius(parseInt(evt.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col">
              <label htmlFor="dot_density_x" className="input-label">Dot Density X</label>
              <InputNumber
                name='dot_density_x'
                value={dotDensityX}
                min={10}
                step={1}
                onChange={evt => setDotDensityX(parseInt(evt.target.value))}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="dot_density_y" className="input-label">Dot Density Y</label>
              <InputNumber
                name='dot_density_y'
                value={dotDensityY}
                min={10}
                step={1}
                onChange={evt => setDotDensityY(parseInt(evt.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-col">
              <label htmlFor="dot_base_radius" className="input-label">Dot Base Radius</label>
              <InputNumber
                name='dot_base_radius'
                value={dotBaseRadius}
                min={10}
                step={1}
                onChange={evt => setDotBaseRadius(parseInt(evt.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
      <canvas id="c" className="bg-white"></canvas>
      <canvas id="d"></canvas>
    </div>
  );
};

render(<Tarp />, document.getElementById('root'));
