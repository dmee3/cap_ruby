import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import InputText from '../../react/components/inputs/InputText';
import InputToggle from '../../react/components/inputs/InputToggle';
import InputSlider from '../../react/components/inputs/InputSlider';

interface GridSettings {
  scale: number; // pixels per inch
  gridSizeFeet: number; // grid spacing in feet
  tarpWidthFeet: number;
  tarpHeightFeet: number;
  showLabels: boolean;
  horizontalOffsetFeet: number; // horizontal offset for vertical lines
  markerScale: number; // scale factor for intersection lines and labels
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

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const scaleStr = formData.get('scale');
    const gridSizeFeetStr = formData.get('gridSizeFeet');
    const tarpWidthFeetStr = formData.get('tarpWidthFeet');
    const tarpHeightFeetStr = formData.get('tarpHeightFeet');
    const horizontalOffsetFeetStr = formData.get('horizontalOffsetFeet');
    const markerScaleStr = formData.get('markerScale');
    const showLabels = formData.get('showLabels') === '1';

    const scale = scaleStr ? Number(scaleStr) : settings.scale;
    const gridSizeFeet = gridSizeFeetStr ? Number(gridSizeFeetStr) : settings.gridSizeFeet;
    const tarpWidthFeet = tarpWidthFeetStr ? Number(tarpWidthFeetStr) : settings.tarpWidthFeet;
    const tarpHeightFeet = tarpHeightFeetStr ? Number(tarpHeightFeetStr) : settings.tarpHeightFeet;
    const horizontalOffsetFeet = horizontalOffsetFeetStr !== null ? Number(horizontalOffsetFeetStr) : settings.horizontalOffsetFeet;
    const markerScale = markerScaleStr ? Number(markerScaleStr) : settings.markerScale;

    setSettings({
      scale: scale > 0 ? scale : settings.scale,
      gridSizeFeet: gridSizeFeet > 0 ? gridSizeFeet : settings.gridSizeFeet,
      tarpWidthFeet: tarpWidthFeet > 0 ? tarpWidthFeet : settings.tarpWidthFeet,
      tarpHeightFeet: tarpHeightFeet > 0 ? tarpHeightFeet : settings.tarpHeightFeet,
      horizontalOffsetFeet: horizontalOffsetFeet >= 0 ? horizontalOffsetFeet : settings.horizontalOffsetFeet,
      markerScale: markerScale > 0 ? markerScale : settings.markerScale,
      showLabels,
    });
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isExport: boolean = false
  ) => {
    const { scale, gridSizeFeet, showLabels, horizontalOffsetFeet, markerScale } = settings;

    // Convert measurements to pixels
    const gridSpacingInches = gridSizeFeet * 12;
    const gridSpacingPixels = gridSpacingInches * scale;
    const horizontalOffsetInches = horizontalOffsetFeet * 12;
    const horizontalOffsetPixels = horizontalOffsetInches * scale;
    const lineWidthInches = 0.5 * markerScale;
    const lineWidthPixels = lineWidthInches * scale;
    const intersectionSegmentInches = 2 * markerScale; // 2 inches on each side of intersection
    const intersectionSegmentPixels = intersectionSegmentInches * scale;

    // Clear canvas
    if (isExport) {
      ctx.clearRect(0, 0, width, height);
    } else {
      // Black background for visibility in tool
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw grid as intersection segments only
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = lineWidthPixels;

    // Draw intersection segments at each grid point
    for (let y = 0; y <= height; y += gridSpacingPixels) {
      for (let x = horizontalOffsetPixels; x <= width; x += gridSpacingPixels) {
        // Draw vertical segment (straight line)
        ctx.beginPath();
        ctx.moveTo(x, y - intersectionSegmentPixels);
        ctx.lineTo(x, y + intersectionSegmentPixels);
        ctx.stroke();

        // Draw horizontal segment (straight line)
        ctx.beginPath();
        ctx.moveTo(x - intersectionSegmentPixels, y);
        ctx.lineTo(x + intersectionSegmentPixels, y);
        ctx.stroke();
      }
    }

    // Draw labels if enabled
    if (showLabels) {
      drawGridLabels(ctx, width, height);
    }
  };

  const drawGridLabels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { scale, gridSizeFeet, horizontalOffsetFeet, tarpHeightFeet, markerScale } = settings;

    const gridSpacingInches = gridSizeFeet * 12;
    const gridSpacingPixels = gridSpacingInches * scale;
    const horizontalOffsetInches = horizontalOffsetFeet * 12;
    const horizontalOffsetPixels = horizontalOffsetInches * scale;
    const fontSizeInches = 1.5 * markerScale;
    const fontSizePixels = fontSizeInches * scale;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${fontSizePixels}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calculate how many rows we have based on tarp height and grid spacing
    const numRows = Math.floor(tarpHeightFeet / gridSizeFeet) + 1;

    // Generate letters starting from A
    const letters = Array.from({ length: numRows }, (_, i) =>
      String.fromCharCode(65 + i) // 65 is 'A' in ASCII
    );

    // Calculate vertical line positions and their numbers
    const verticalLinePositions: { x: number; number: number }[] = [];
    for (let x = horizontalOffsetPixels; x <= width; x += gridSpacingPixels) {
      verticalLinePositions.push({ x, number: 0 });
    }

    // Assign numbers: 15 at edges, 50 at center
    const centerIndex = Math.floor((verticalLinePositions.length - 1) / 2);
    for (let i = 0; i < verticalLinePositions.length; i++) {
      const distanceFromCenter = Math.abs(i - centerIndex);
      const number = 50 - (distanceFromCenter * 5);
      verticalLinePositions[i].number = number;
    }

    // Draw labels at grid intersections
    let rowIndex = 0;
    for (let y = 0; y <= height; y += gridSpacingPixels) {
      // Calculate letter index from bottom to top (reverse order)
      const letterIndex = numRows - 1 - rowIndex;
      const letter = letters[letterIndex] || '';

      for (const { x, number } of verticalLinePositions) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI); // Rotate 180 degrees (upside down)

        const horizontalOffsetInches = 1.5 * markerScale;
        const verticalOffsetInches = 1.5 * markerScale;
        const horizontalOffset = horizontalOffsetInches * scale;
        const verticalOffset = verticalOffsetInches * scale;

        // Draw letter (upper-right in rotated space)
        ctx.fillText(letter, -horizontalOffset, verticalOffset);
        // Draw number (upper-left in rotated space)
        ctx.fillText(number.toString(), horizontalOffset, verticalOffset);

        ctx.restore();
      }

      rowIndex++;
    }
  };

  const handleExport = () => {
    const exportCanvas = exportCanvasRef.current;
    if (!exportCanvas) return;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const { scale, tarpWidthFeet, tarpHeightFeet, gridSizeFeet } = settings;
    const width = tarpWidthFeet * 12 * scale;
    const height = tarpHeightFeet * 12 * scale;

    exportCanvas.width = width;
    exportCanvas.height = height;

    // Draw grid with transparent background
    drawGrid(ctx, width, height, true);

    // Export as PNG
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
    const width = tarpWidthFeet * 12 * scale;
    const height = tarpHeightFeet * 12 * scale;

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

      {/* Controls Panel */}
      <form onChange={handleFormChange} className="bg-secondary-dark rounded-lg p-10 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-8">
        <div className="py-2">
          <label className="input-label mb-3 block" htmlFor="scale">
            Scale (pixels per inch):
          </label>
          <InputText
            name="scale"
            id="scale"
            value={settings.scale.toString()}
          />
        </div>

        <div className="py-2">
          <label className="input-label mb-3 block" htmlFor="gridSizeFeet">
            Grid Size (feet):
          </label>
          <InputText
            name="gridSizeFeet"
            id="gridSizeFeet"
            value={settings.gridSizeFeet.toString()}
          />
        </div>

        <div className="py-2">
          <label className="input-label mb-3 block" htmlFor="tarpWidthFeet">
            Tarp Width (feet):
          </label>
          <InputText
            name="tarpWidthFeet"
            id="tarpWidthFeet"
            value={settings.tarpWidthFeet.toString()}
          />
        </div>

        <div className="py-2">
          <label className="input-label mb-3 block" htmlFor="tarpHeightFeet">
            Tarp Height (feet):
          </label>
          <InputText
            name="tarpHeightFeet"
            id="tarpHeightFeet"
            value={settings.tarpHeightFeet.toString()}
          />
        </div>

        <div className="py-2">
          <label className="input-label mb-3 block" htmlFor="horizontalOffsetFeet">
            Horizontal Offset (feet):
          </label>
          <InputText
            name="horizontalOffsetFeet"
            id="horizontalOffsetFeet"
            value={settings.horizontalOffsetFeet.toString()}
          />
        </div>

        <div className="py-2">
          <InputSlider
            id="markerScale"
            name="markerScale"
            min={0.5}
            max={2}
            step={0.1}
            value={settings.markerScale}
            onChange={(value) => updateSetting('markerScale', value)}
            label="Marker Scale:"
          />
        </div>

        <div className="py-2 flex items-center">
          <InputToggle
            id="showLabels"
            name="showLabels"
            checked={settings.showLabels}
            onChange={(checked: boolean) => updateSetting('showLabels', checked)}
            text="Show Labels"
          />
        </div>

        <div className="py-2">
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary w-full py-3"
          >
            Export Grid
          </button>
        </div>
      </form>

      {/* Canvas Container */}
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

      {/* Hidden export canvas */}
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Mount the component to the DOM
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<TarpGridTool />);
  }
});

export default TarpGridTool;
