import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import InputText from '../../react/components/inputs/InputText';
import InputToggle from '../../react/components/inputs/InputToggle';
import InputSlider from '../../react/components/inputs/InputSlider';

// Constants
const INCHES_PER_FOOT = 12;
const ASCII_CODE_A = 65;
const LABEL_NUMBERING = {
  CENTER: 50,
  EDGE: 15,
  INCREMENT: 5,
} as const;

const MARKER_DEFAULTS = {
  LINE_WIDTH_INCHES: 0.5,
  SEGMENT_LENGTH_INCHES: 2,
  FONT_SIZE_INCHES: 1.5,
  LABEL_OFFSET_INCHES: 1.5,
} as const;

interface GridSettings {
  scale: number;
  gridSizeFeet: number;
  tarpWidthFeet: number;
  tarpHeightFeet: number;
  showLabels: boolean;
  horizontalOffsetFeet: number;
  markerScale: number;
}

interface GridDimensions {
  gridSpacingPixels: number;
  horizontalOffsetPixels: number;
  lineWidthPixels: number;
  intersectionSegmentPixels: number;
}

const TarpGridTool: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<GridSettings>({
    scale: 10,
    gridSizeFeet: 6,
    tarpWidthFeet: 90,
    tarpHeightFeet: 60,
    showLabels: true,
    horizontalOffsetFeet: 3,
    markerScale: 1,
  });

  const updateSetting = <K extends keyof GridSettings>(key: K, value: GridSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const calculateDimensions = (): GridDimensions => {
    const { scale, gridSizeFeet, horizontalOffsetFeet, markerScale } = settings;

    return {
      gridSpacingPixels: gridSizeFeet * INCHES_PER_FOOT * scale,
      horizontalOffsetPixels: horizontalOffsetFeet * INCHES_PER_FOOT * scale,
      lineWidthPixels: MARKER_DEFAULTS.LINE_WIDTH_INCHES * markerScale * scale,
      intersectionSegmentPixels: MARKER_DEFAULTS.SEGMENT_LENGTH_INCHES * markerScale * scale,
    };
  };

  const getFormFieldNumber = (formData: FormData, fieldName: string, fallback: number, minValue: number = 1): number => {
    const value = formData.get(fieldName);
    if (!value) return fallback;

    const num = Number(value);
    return num >= minValue ? num : fallback;
  };

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);

    setSettings({
      scale: getFormFieldNumber(formData, 'scale', settings.scale),
      gridSizeFeet: getFormFieldNumber(formData, 'gridSizeFeet', settings.gridSizeFeet),
      tarpWidthFeet: getFormFieldNumber(formData, 'tarpWidthFeet', settings.tarpWidthFeet),
      tarpHeightFeet: getFormFieldNumber(formData, 'tarpHeightFeet', settings.tarpHeightFeet),
      horizontalOffsetFeet: getFormFieldNumber(formData, 'horizontalOffsetFeet', settings.horizontalOffsetFeet, 0),
      markerScale: getFormFieldNumber(formData, 'markerScale', settings.markerScale, 0.1),
      showLabels: formData.get('showLabels') === '1',
    });
  };

  const drawIntersectionMarker = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    segmentLength: number
  ) => {
    // Vertical segment
    ctx.beginPath();
    ctx.moveTo(x, y - segmentLength);
    ctx.lineTo(x, y + segmentLength);
    ctx.stroke();

    // Horizontal segment
    ctx.beginPath();
    ctx.moveTo(x - segmentLength, y);
    ctx.lineTo(x + segmentLength, y);
    ctx.stroke();
  };

  const generateGridLabels = (numRows: number) => {
    return Array.from({ length: numRows }, (_, i) => String.fromCharCode(ASCII_CODE_A + i));
  };

  const calculateVerticalLineNumbers = (width: number, gridSpacingPixels: number, horizontalOffsetPixels: number) => {
    const positions: { x: number; number: number }[] = [];

    for (let x = horizontalOffsetPixels; x <= width; x += gridSpacingPixels) {
      positions.push({ x, number: 0 });
    }

    const centerIndex = Math.floor((positions.length - 1) / 2);

    return positions.map((pos, i) => {
      const distanceFromCenter = Math.abs(i - centerIndex);
      return {
        ...pos,
        number: LABEL_NUMBERING.CENTER - (distanceFromCenter * LABEL_NUMBERING.INCREMENT)
      };
    });
  };

  const drawGridLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { scale, gridSizeFeet, tarpHeightFeet, markerScale } = settings;
    const { gridSpacingPixels, horizontalOffsetPixels } = calculateDimensions();

    const fontSizePixels = MARKER_DEFAULTS.FONT_SIZE_INCHES * markerScale * scale;
    const labelOffset = MARKER_DEFAULTS.LABEL_OFFSET_INCHES * markerScale * scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${fontSizePixels}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const numRows = Math.floor(tarpHeightFeet / gridSizeFeet) + 1;
    const letters = generateGridLabels(numRows);
    const verticalLinePositions = calculateVerticalLineNumbers(width, gridSpacingPixels, horizontalOffsetPixels);

    let rowIndex = 0;
    for (let y = 0; y <= height; y += gridSpacingPixels) {
      const letterIndex = numRows - 1 - rowIndex;
      const letter = letters[letterIndex] || '';

      for (const { x, number } of verticalLinePositions) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI);

        ctx.fillText(letter, -labelOffset, labelOffset);
        ctx.fillText(number.toString(), labelOffset, labelOffset);

        ctx.restore();
      }

      rowIndex++;
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, isExport: boolean = false) => {
    const { showLabels } = settings;
    const { gridSpacingPixels, horizontalOffsetPixels, lineWidthPixels, intersectionSegmentPixels } = calculateDimensions();

    // Set background
    if (isExport) {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw intersection markers
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = lineWidthPixels;

    for (let y = 0; y <= height; y += gridSpacingPixels) {
      for (let x = horizontalOffsetPixels; x <= width; x += gridSpacingPixels) {
        drawIntersectionMarker(ctx, x, y, intersectionSegmentPixels);
      }
    }

    if (showLabels) {
      drawGridLabels(ctx, width, height);
    }
  };

  const handleExport = () => {
    const exportCanvas = exportCanvasRef.current;
    if (!exportCanvas) return;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const { scale, tarpWidthFeet, tarpHeightFeet, gridSizeFeet } = settings;
    const width = tarpWidthFeet * INCHES_PER_FOOT * scale;
    const height = tarpHeightFeet * INCHES_PER_FOOT * scale;

    exportCanvas.width = width;
    exportCanvas.height = height;

    drawGrid(ctx, width, height, true);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tarp-grid-${tarpWidthFeet}x${tarpHeightFeet}-${gridSizeFeet}ft-scale${scale}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, tarpWidthFeet, tarpHeightFeet } = settings;
    const width = tarpWidthFeet * INCHES_PER_FOOT * scale;
    const height = tarpHeightFeet * INCHES_PER_FOOT * scale;

    canvas.width = width;
    canvas.height = height;

    drawGrid(ctx, width, height, false);
  }, [settings]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff'
    }}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Tarp Grid Tool</h1>

      <form onChange={handleFormChange} className="bg-secondary-dark rounded-lg p-10 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-8">
        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label htmlFor="scale">Scale (pixels per inch):</label>
          </div>
          <div className="flex items-center flex-1">
            <InputText
              name="scale"
              id="scale"
              value={settings.scale.toString()}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label htmlFor="gridSizeFeet">Grid Size (feet):</label>
          </div>
          <div className="flex items-center flex-1">
            <InputText
              name="gridSizeFeet"
              id="gridSizeFeet"
              value={settings.gridSizeFeet.toString()}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label htmlFor="tarpWidthFeet">Tarp Width (feet):</label>
          </div>
          <div className="flex items-center flex-1">
            <InputText
              name="tarpWidthFeet"
              id="tarpWidthFeet"
              value={settings.tarpWidthFeet.toString()}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label htmlFor="tarpHeightFeet">Tarp Height (feet):</label>
          </div>
          <div className="flex items-center flex-1">
            <InputText
              name="tarpHeightFeet"
              id="tarpHeightFeet"
              value={settings.tarpHeightFeet.toString()}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label htmlFor="horizontalOffsetFeet">Horizontal Offset (feet):</label>
          </div>
          <div className="flex items-center flex-1">
            <InputText
              name="horizontalOffsetFeet"
              id="horizontalOffsetFeet"
              value={settings.horizontalOffsetFeet.toString()}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center justify-between">
            <label htmlFor="markerScale">Marker Scale (value of 1 = 4 inches wide):</label>
            <span className="text-ocean font-semibold ml-2">{settings.markerScale}</span>
          </div>
          <div className="flex items-center flex-1">
            <InputSlider
              id="markerScale"
              name="markerScale"
              min={0.5}
              max={2}
              step={0.05}
              value={settings.markerScale}
              onChange={(value) => updateSetting('markerScale', value)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="input-label mb-3 h-6 flex items-center">
            <label>Show Labels:</label>
          </div>
          <div className="flex items-center flex-1">
            <InputToggle
              id="showLabels"
              name="showLabels"
              checked={settings.showLabels}
              onChange={(checked: boolean) => updateSetting('showLabels', checked)}
              text=""
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="h-6 mb-3"></div>
          <div className="flex items-center flex-1">
            <button
              type="button"
              onClick={handleExport}
              className="btn-primary btn-md w-full"
            >
              Export Grid
            </button>
          </div>
        </div>
      </form>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
        flex: 1
      }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #4a4a4a',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>

      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<TarpGridTool />);
  }
});

export default TarpGridTool;
