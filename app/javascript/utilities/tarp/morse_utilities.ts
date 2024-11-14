export const drawMorseDot = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
};

export const drawMorseLine = (
  ctx: CanvasRenderingContext2D, x: number, y: number, width: number, radius: number, color: string
) => {
  drawMorseDot(ctx, x, y, radius, color);
  drawMorseDot(ctx, x + width, y, radius, color);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineWidth = radius * 2;
  ctx.strokeStyle = color;
  ctx.stroke();
};

export const drawVerticalMorseLine = (
  ctx: CanvasRenderingContext2D, x: number, y: number, height: number, radius: number, color: string
) => {
  drawMorseDot(ctx, x, y, radius, color);
  drawMorseDot(ctx, x, y + height, radius, color);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + height);
  ctx.lineWidth = radius * 2;
  ctx.strokeStyle = color;
  ctx.stroke();
};

export const parseMorseString = (morseString: string) => {
  const morseArray = morseString.split('');
  return morseArray.map((morseChar) => {
    switch (morseChar) {
      case '.':
        return {
          type: 'dot',
          length: 1,
          color: 'default'
        };
      case '-':
        return {
          type: 'dash',
          length: 3,
          color: 'default'
        }
      case 'd':
        return {
          type: 'dot',
          length: 1,
          color: 'highlight'
        }
      case 'l':
        return {
          type: 'dash',
          length: 3,
          color: 'highlight'
        }
      case ' ':
        return {
          type: 'space',
          length: 1,
          color: 'default'
        }
      default:
        console.log('Invalid character');
    }
  });
}

export const drawEqualizerVertical = (ctx: CanvasRenderingContext2D, morseArray, morseStartX, morseBaseY, sp, morseDotRadius, morseBaseColor, morseHighlightColor) => {
  for (let i = 0; i < morseArray.length; i++) {
    const morseInfo = parseMorseString(morseArray[i]);
    const morseLength = morseInfo.reduce((acc, morse) => acc + morse.length, 0);

    let lengthAccum = 0;
    morseInfo.forEach((morse) => {
      const xPos = morseStartX + i * sp;
      const yPos = morseBaseY - morseLength / 2 * sp + lengthAccum * sp;
      if (morse.type === 'dot') {
        drawMorseDot(ctx, xPos, yPos, morseDotRadius, morse.color === 'highlight' ? morseHighlightColor : morseBaseColor);
        lengthAccum += 1;
      } else if (morse.type === 'dash') {
        drawVerticalMorseLine(ctx, xPos, yPos, 130, morseDotRadius, morse.color === 'highlight' ? morseHighlightColor : morseBaseColor);
        lengthAccum += 3;
      }
    });
  }
};

export const drawEqualizerHorizontal = (ctx: CanvasRenderingContext2D, morseArray, morseStartX, morseBaseY, sp, morseDotRadius, morseBaseColor, morseHighlightColor) => {
  for (let i = 0; i < morseArray.length; i++) {
    const morseInfo = parseMorseString(morseArray[i]);

    let lengthAccum = 0;
    morseInfo.forEach((morse) => {
      const xPos = morseStartX + i * sp;
      const yPos = morseBaseY + sp - Math.ceil(morseInfo.length / 2) * sp + lengthAccum * sp;
      if (morse.type === 'dot') {
        drawMorseDot(ctx, xPos, yPos, morseDotRadius, morse.color === 'highlight' ? morseHighlightColor : morseBaseColor);
      } else if (morse.type === 'dash') {
        drawMorseLine(ctx, xPos, yPos, 130, morseDotRadius, morse.color === 'highlight' ? morseHighlightColor : morseBaseColor);
      }
      lengthAccum += 1;
    });
  }
}
