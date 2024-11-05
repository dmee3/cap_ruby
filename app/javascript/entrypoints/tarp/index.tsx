import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'
import InputNumber from '../../react/components/inputs/InputNumber';

const Tarp = () => {
  const MORSE_RADIUS = 40;

  const CANVAS_WIDTH = 3200;
  const CANVAS_HEIGHT = 1600;

  const [wave1Frequency, setWave1Frequency] = useState(1);
  const [wave1Amplitude, setWave1Amplitude] = useState(60);
  const [wave2Frequency, setWave2Frequency] = useState(2);
  const [wave2Amplitude, setWave2Amplitude] = useState(44);
  const [waveOffset, setWaveOffset] = useState(500);
  const [centerGapRadius, setCenterGapRadius] = useState(200);
  const [dotDensityX, setDotDensityX] = useState(120);
  const [dotDensityY, setDotDensityY] = useState(30);
  const [dotBaseRadius, setDotBaseRadius] = useState(12);

  const hexToRgb = (hex: string): [number, number, number] => {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the r, g, b values
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return [r, g, b];
  };

  const getColorAtPoint = (gradient: CanvasGradient, point: number): string => {
    // Create a temporary canvas to draw the gradient
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = CANVAS_HEIGHT; // Height can be any value, we just need a vertical gradient
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
      throw new Error('Could not get 2D context');
    }

    // Draw the gradient on the temporary canvas
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, 1, CANVAS_HEIGHT);

    // Get the color at the specified point
    const y = Math.floor(point * (CANVAS_HEIGHT - 1)); // Convert point to a y-coordinate
    const imageData = tempCtx.getImageData(0, y, 1, 1).data;

    // Convert the color to a CSS rgb string
    const color = `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
    return color;
  };

  // Colors
  const GRADIENT_START_COLOR = `rgb(${hexToRgb('#2f2234').join(',')})`;
  const GRADIENT_END_COLOR = `rgb(${hexToRgb('#0a0a14').join(',')})`;
  const MORSE_COLOR = `rgb(${hexToRgb('#060614').join(',')})`;

  const baseWaveFunc = (x: number) => {
    return Math.sin((2 * Math.PI / dotDensityX) * x);
  };

  const higherOrderWaveFunc = (x: number) => {
    const waves = [
      wave1Amplitude * Math.sin(8 * wave1Frequency * x),
      wave2Amplitude * Math.cos(14 * wave2Frequency * x + Math.PI)
    ];
    return waves.reduce((acc, wave) => acc + wave, 0);
  };

  const polarToCartesian = (centerX: number, centerY: number, r: number, theta: number) => {
    const x = centerX + r * Math.cos(theta);
    const y = centerY + r * Math.sin(theta);
    return { x, y };
  };

  const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

  const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);

  const interpolateColor = (startColor: number[], endColor: number[], factor: number) => {
    const result = startColor.slice();
    for (let i = 0; i < startColor.length; i++) {
      result[i] = Math.round(result[i] + factor * (endColor[i] - startColor[i]));
    }
    return result;
  };

  const drawMorseDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(x, y, MORSE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = MORSE_COLOR;
    ctx.fill();
  };

  const drawMorseLine = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number) => {
    drawMorseDot(ctx, x, y);
    drawMorseDot(ctx, x + width, y);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineWidth = MORSE_RADIUS * 2;
    ctx.strokeStyle = MORSE_COLOR;
    ctx.stroke();
  };

  const canYouHearMe = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // C
    drawMorseLine(ctx, x, y, 200);
    drawMorseDot(ctx, x + 300, y);
    drawMorseLine(ctx, x + 400, y, 200);
    drawMorseDot(ctx, x + 700, y);

    // a
    drawMorseDot(ctx, x + 900, y);
    drawMorseLine(ctx, x + 1000, y, 200);

    // n
    drawMorseLine(ctx, x + 1400, y, 200);
    drawMorseDot(ctx, x + 1700, y);

    // Y
    drawMorseLine(ctx, x + 1900, y, 200);
    drawMorseDot(ctx, x + 2200, y);
    drawMorseLine(ctx, x + 2300, y, 200);
    drawMorseLine(ctx, x + 2600, y, 200);

    // o
    drawMorseLine(ctx, x + 3000, y, 200);
    drawMorseLine(ctx, x + 3300, y, 200);
    drawMorseLine(ctx, x + 3600, y, 200);

    // u
    drawMorseDot(ctx, x + 4000, y);
    drawMorseDot(ctx, x + 4100, y);
    drawMorseLine(ctx, x + 4200, y, 200);

    // H
    drawMorseDot(ctx, x + 4600, y);
    drawMorseDot(ctx, x + 4700, y);
    drawMorseDot(ctx, x + 4800, y);
    drawMorseDot(ctx, x + 4900, y);

    // e
    drawMorseDot(ctx, x + 5100, y);

    // a
    drawMorseDot(ctx, x + 5300, y);
    drawMorseLine(ctx, x + 5400, y, 200);

    // r
    drawMorseDot(ctx, x + 5800, y);
    drawMorseLine(ctx, x + 5900, y, 200);
    drawMorseDot(ctx, x + 6200, y);

    // M
    drawMorseLine(ctx, x + 6400, y, 200);
    drawMorseLine(ctx, x + 6700, y, 200);

    // e
    drawMorseDot(ctx, x + 7100, y);

    // ?
    drawMorseDot(ctx, x + 7300, y);
    drawMorseDot(ctx, x + 7400, y);
    drawMorseLine(ctx, x + 7500, y, 200);
    drawMorseLine(ctx, x + 7800, y, 200);
    drawMorseDot(ctx, x + 8100, y);
    drawMorseDot(ctx, x + 8200, y);
  }

  const drawMorseCodeBackground = (ctx: CanvasRenderingContext2D) => {
    let i = 100;
    while (i < CANVAS_HEIGHT + 500) {
      canYouHearMe(ctx, 100, i);
      canYouHearMe(ctx, -1000, i + 150);
      canYouHearMe(ctx, -1300, i + 300);
      canYouHearMe(ctx, -400, i + 450);
      canYouHearMe(ctx, -700, i + 600);
      canYouHearMe(ctx, -1900, i + 750);
      canYouHearMe(ctx, -2200, i + 900);
      canYouHearMe(ctx, -1600, i + 1050);
      canYouHearMe(ctx, -2500, i + 1200);
      i += 1350;
    }
  }

  const drawGradientBackground = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    grad.addColorStop(0, GRADIENT_START_COLOR);
    grad.addColorStop(1, GRADIENT_END_COLOR);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const drawCircle = (ctx, sineYOffset, circle) => {
    const waveY = sineYOffset + higherOrderWaveFunc(circle.theta);
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
      const color = getColorAtPoint(arc.gradient, factor);

      for (let i = 0; i < dotDensityX; i++) {
        const angle = (i / dotDensityX) * 2 * Math.PI;
        const radius = centerGapRadius + j * baseCircleDiameter + baseWaveFunc(i) * baseCircleDiameter + j;
        const circleRadius = baseCircleRadius + 2 * baseWaveFunc(i) - (dotDensityY / 2 - j) * 0.001;
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
    console.log('redraw');
    const canvas = document.getElementById('c') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    drawGradientBackground(ctx);
    drawMorseCodeBackground(ctx);

    const gradOne = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    gradOne.addColorStop(0, '#d75e4d');
    gradOne.addColorStop(0.5, '#734248');
    gradOne.addColorStop(1, '#0c3642');

    const gradTwo = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    gradTwo.addColorStop(0, '#e96f60');
    gradTwo.addColorStop(0.5, '#f06b96');
    gradTwo.addColorStop(1, '#2d3f6f');

    const gradThree = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    gradThree.addColorStop(0, '#ffd87f');
    gradThree.addColorStop(0.5, '#f58d56');
    gradThree.addColorStop(1, '#3f5548');

    const gradFour = ctx.createLinearGradient(0, 0, 1, CANVAS_HEIGHT);
    gradFour.addColorStop(0, '#00edd3');
    gradFour.addColorStop(0.5, '#127cb8');
    gradFour.addColorStop(1, '#0b4f66');

    const arcs = [
      { centerX: 50, centerY: 50, gradient: gradOne },
      { centerX: CANVAS_WIDTH - 50, centerY: 50, gradient: gradTwo },
      { centerX: CANVAS_WIDTH - 50, centerY: CANVAS_HEIGHT - 50, gradient: gradThree },
      { centerX: 50, centerY: CANVAS_HEIGHT - 50, gradient: gradFour }
    ]

    for (let i = 0; i < arcs.length; i++) {
      drawArc(ctx, arcs[i], waveOffset, centerGapRadius, dotBaseRadius);
    };
  }, [wave1Amplitude, wave1Frequency, wave2Amplitude, wave2Frequency, waveOffset, centerGapRadius, dotDensityX, dotDensityY, dotBaseRadius]);

  return (
    <div>
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
      <canvas id="c" className="bg-white"></canvas>
    </div>
  );
};

render(<Tarp />, document.getElementById('root'));
