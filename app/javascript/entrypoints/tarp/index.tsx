import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'
import InputNumber from '../../react/components/inputs/InputNumber';
import { getColorAtPoint, hexToRgb } from '../../utilities/tarp/color_utilities';
import { baseWaveFunc, higherOrderWaveFunc } from '../../utilities/tarp/wave_utilities';
import { drawEqualizerHorizontal, drawEqualizerVertical, drawMorseDot, drawMorseLine, drawVerticalMorseLine, parseMorseString } from '../../utilities/tarp/morse_utilities';

const Tarp = () => {
  const MORSE_RADIUS = 40;

  const CANVAS_WIDTH = 3000;
  const CANVAS_HEIGHT = 1600;

  const [wave1Frequency, setWave1Frequency] = useState(.7);
  const [wave1Amplitude, setWave1Amplitude] = useState(60);
  const [wave2Frequency, setWave2Frequency] = useState(.4);
  const [wave2Amplitude, setWave2Amplitude] = useState(44);
  const [waveOffset, setWaveOffset] = useState(350);
  const [centerGapRadius, setCenterGapRadius] = useState(75);
  const [dotDensityX, setDotDensityX] = useState(120);
  const [dotDensityY, setDotDensityY] = useState(30);
  const [dotBaseRadius, setDotBaseRadius] = useState(12);

  // Colors
  const GRADIENT_START_COLOR = `rgb(${hexToRgb('#19071c').join(',')})`;
  const GRADIENT_END_COLOR = `rgb(${hexToRgb('#19071c').join(',')})`;
  // const MORSE_COLOR = `rgb(${hexToRgb('#060614').join(',')})`;

  // const canYouHearMe = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  //   // C
  //   drawMorseLine(ctx, x, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 300, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 400, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 700, y, MORSE_RADIUS, MORSE_COLOR);

  //   // a
  //   drawMorseDot(ctx, x + 900, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 1000, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // n
  //   drawMorseLine(ctx, x + 1400, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 1700, y, MORSE_RADIUS, MORSE_COLOR);

  //   // Y
  //   drawMorseLine(ctx, x + 1900, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 2200, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 2300, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 2600, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // o
  //   drawMorseLine(ctx, x + 3000, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 3300, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 3600, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // u
  //   drawMorseDot(ctx, x + 4000, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 4100, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 4200, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // H
  //   drawMorseDot(ctx, x + 4600, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 4700, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 4800, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 4900, y, MORSE_RADIUS, MORSE_COLOR);

  //   // e
  //   drawMorseDot(ctx, x + 5100, y, MORSE_RADIUS, MORSE_COLOR);

  //   // a
  //   drawMorseDot(ctx, x + 5300, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 5400, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // r
  //   drawMorseDot(ctx, x + 5800, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 5900, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 6200, y, MORSE_RADIUS, MORSE_COLOR);

  //   // M
  //   drawMorseLine(ctx, x + 6400, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 6700, y, 200, MORSE_RADIUS, MORSE_COLOR);

  //   // e
  //   drawMorseDot(ctx, x + 7100, y, MORSE_RADIUS, MORSE_COLOR);

  //   // ?
  //   drawMorseDot(ctx, x + 7300, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 7400, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 7500, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseLine(ctx, x + 7800, y, 200, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 8100, y, MORSE_RADIUS, MORSE_COLOR);
  //   drawMorseDot(ctx, x + 8200, y, MORSE_RADIUS, MORSE_COLOR);
  // }

  // const drawMorseCodeBackground = (ctx: CanvasRenderingContext2D) => {
  //   let i = 50;
  //   while (i < CANVAS_HEIGHT + 500) {
  //     canYouHearMe(ctx, 100, i);
  //     canYouHearMe(ctx, -1000, i + 150);
  //     canYouHearMe(ctx, -1300, i + 300);
  //     canYouHearMe(ctx, -400, i + 450);
  //     canYouHearMe(ctx, -700, i + 600);
  //     canYouHearMe(ctx, -1900, i + 750);
  //     canYouHearMe(ctx, -2200, i + 900);
  //     canYouHearMe(ctx, -1600, i + 1050);
  //     canYouHearMe(ctx, -2500, i + 1200);
  //     i += 1350;
  //   }
  // }

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
      adjustedRadius = adjustedRadius * Math.exp(-distanceFromWave / 150);
      if (adjustedRadius < 0.5) {
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
      const color = getColorAtPoint(arc.gradient, factor, CANVAS_HEIGHT);

      for (let i = 0; i < dotDensityX; i++) {
        const angle = (i / dotDensityX) * 2 * Math.PI;
        const radius = centerGapRadius + j * baseCircleDiameter + baseWaveFunc(i, dotDensityX) * baseCircleDiameter + 20 * j;
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
    // drawMorseCodeBackground(ctx);

    const orangeGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    orangeGrad.addColorStop(0, '#d75e4d');
    orangeGrad.addColorStop(0.5, '#734248');
    orangeGrad.addColorStop(1, '#0c3642');

    const redGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    redGrad.addColorStop(0, '#ed6f9b');
    redGrad.addColorStop(0.5, '#d94848');
    redGrad.addColorStop(1, '#4f2d6f');

    const yellowGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    yellowGrad.addColorStop(0, '#ffd87f');
    yellowGrad.addColorStop(0.5, '#f58d56');
    yellowGrad.addColorStop(1, '#3f5548');

    const tealGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    tealGrad.addColorStop(0, '#00edd3');
    tealGrad.addColorStop(0.5, '#127cb8');
    tealGrad.addColorStop(1, '#0b4f66');

    const tealGradNew = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    tealGradNew.addColorStop(0, '#09efd4');
    tealGradNew.addColorStop(0.5, '#006661');
    tealGradNew.addColorStop(1, '#2e0f38');

    const purpleGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    purpleGrad.addColorStop(0, '#b45dbb');
    purpleGrad.addColorStop(0.5, '#8351a8');
    purpleGrad.addColorStop(1, '#2e0f38');

    const orangeGradNew = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    orangeGradNew.addColorStop(0, '#f8b10f');
    orangeGradNew.addColorStop(0.5, '#b44e1b');
    orangeGradNew.addColorStop(1, '#7a3018');

    const pinkGrad = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    pinkGrad.addColorStop(0, '#ec1dbd');
    pinkGrad.addColorStop(0.5, '#a12585');
    pinkGrad.addColorStop(1, '#5b273d');

    const arcs = [
      { centerX: 0, centerY: 0, gradient: orangeGradNew },
      { centerX: CANVAS_WIDTH, centerY: 0, gradient: tealGradNew },
      { centerX: CANVAS_WIDTH, centerY: CANVAS_HEIGHT, gradient: yellowGrad },
      { centerX: 0, centerY: CANVAS_HEIGHT, gradient: pinkGrad }
    ]

    for (let i = 0; i < arcs.length; i++) {
      drawArc(ctx, arcs[i], waveOffset + 200, 0, dotBaseRadius);
    };

    // const morseArray = [
    //   '.', '-', '...',
    //   'ldld', 'dl', 'ld.-',
    //   '-.-', '..',
    //   'ldll', 'lll.', '.ddl',
    //   '--..', '..-',
    //   'dddd', '-d-', '--dl', 'dld',
    //   '-..', '-.',
    //   'll', 'd', 'ddlldd',
    //   '--..', '-.', '-', '.'
    // ];

    const morseArray = [
      '.',
      'l.d',
      ' .d',
      '. .d.l',
      '.d.d. ',
      '.l.l... .',
      '. . .d.l.',
      ' . ... ',
      '..d.l.d. ..',
      '.l. .l...',
      ' . . .d',
      '... ... .....',
      '....d.l...d....',
      '....... .d.d.....',
      '..d. .l.l..',
      '...l.l. . ...',
      '. . . . .',
      '. . .d.l.',
      '.l...',
      '..l. ... ..',
      '.. . ...d..',
      '.....d',
      'd.d....',
      '.d...',
      'l..',
      '..',
      '.',
      '.'
    ];

    const morseSpacing = 70;
    const morseStartX = CANVAS_WIDTH / 2 - .5 * morseSpacing * morseArray.length;
    const morseBaseY = CANVAS_HEIGHT / 2;
    const morseDotRadius = 24;
    const morseBaseColor = '#2e0f38';
    const morseHighlightColor = '#8351a8';

    drawEqualizerHorizontal(ctx, morseArray, morseStartX, morseBaseY, morseSpacing, morseDotRadius, morseBaseColor, morseHighlightColor);

    // drawEqualizerVertical(ctx, morseArray, morseStartX, morseBaseY, sp, morseDotRadius, MORSE_COLOR, morseHighlightColor);


    // const canvasTwo = document.getElementById('d') as HTMLCanvasElement;
    // const ctxTwo = canvasTwo.getContext('2d');
    // canvasTwo.width = CANVAS_WIDTH;
    // canvasTwo.height = CANVAS_HEIGHT;

    // ctxTwo.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // drawArc(ctxTwo, { centerX: CANVAS_WIDTH / 2, centerY: CANVAS_HEIGHT / 2, gradient: purpleGrad }, waveOffset + 200, centerGapRadius, dotBaseRadius);

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
