"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useDrawingStore } from "@/lib/store/drawingStore";

// Color conversion functions
function hexToHsl(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

// Preset colors
const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
  "#A52A2A", // Brown
  "#808080", // Gray
  "#FFD700", // Gold
  "#008000", // Dark Green
  "#000080", // Navy
];

export function ColorPicker() {
  const { brushSettings, setBrushColor } = useDrawingStore();
  const [hsl, setHsl] = useState(() => hexToHsl(brushSettings.color));
  const [rgb, setRgb] = useState(() => hexToRgb(brushSettings.color));
  const [isDragging, setIsDragging] = useState(false);
  const colorAreaRef = useRef<HTMLDivElement>(null);

  // Sync HSL and RGB when color changes externally
  useEffect(() => {
    const newHsl = hexToHsl(brushSettings.color);
    setHsl(newHsl);
    setRgb(hexToRgb(brushSettings.color));
  }, [brushSettings.color]);

  const handleHslChange = (h: number, s: number, l: number) => {
    setHsl([h, s, l]);
    const hex = hslToHex(h, s, l);
    setBrushColor(hex);
    setRgb(hslToRgb(h, s, l));
  };

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setBrushColor(hex);
      const newHsl = hexToHsl(hex);
      setHsl(newHsl);
      setRgb(hexToRgb(hex));
    }
  };

  const handleRgbChange = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    setBrushColor(hex);
    const newHsl = hexToHsl(hex);
    setHsl(newHsl);
    setRgb([r, g, b]);
  };

  const getColorFromPosition = (clientX: number, clientY: number) => {
    if (!colorAreaRef.current) return;
    const rect = colorAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 100);
    handleHslChange(hsl[0], s, l);
  };

  const handleColorAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    getColorFromPosition(e.clientX, e.clientY);
  };

  const handleColorAreaMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    getColorFromPosition(e.clientX, e.clientY);
  };

  const handleColorAreaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    getColorFromPosition(touch.clientX, touch.clientY);
  };

  const handleColorAreaTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    getColorFromPosition(touch.clientX, touch.clientY);
  };

  const handleColorAreaTouchEnd = () => {
    setIsDragging(false);
  };

  const handlePresetClick = (color: string) => {
    setBrushColor(color);
    const newHsl = hexToHsl(color);
    setHsl(newHsl);
    setRgb(hexToRgb(color));
  };

  // Calculate position of color indicator on 2D area
  const indicatorX = (hsl[1] / 100) * 100;
  const indicatorY = 100 - (hsl[2] / 100) * 100;

  // Generate hue gradient for the color area
  const hueColor = `hsl(${hsl[0]}, 100%, 50%)`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Color picker"
          className="h-10 w-10 border-2 p-0"
          size="icon"
          variant="outline"
        >
          <div
            className="h-full w-full rounded-md"
            style={{ backgroundColor: brushSettings.color }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="space-y-2">
          {/* Color preview - compact inline */}
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-md border-2 border-border shadow-sm"
              style={{ backgroundColor: brushSettings.color }}
            />
            <Input
              className="h-8 flex-1 font-mono text-sm"
              id="hex"
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              value={brushSettings.color.toUpperCase()}
            />
          </div>

          {/* 2D Color Picker Area */}
          <div className="space-y-1">
            <div className="relative flex gap-2">
              {/* Saturation/Lightness 2D Area */}
              <div
                className="relative h-24 w-24 cursor-crosshair touch-none rounded-md border border-border shadow-sm"
                onClick={handleColorAreaClick}
                onMouseDown={() => setIsDragging(true)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleColorAreaMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onTouchEnd={handleColorAreaTouchEnd}
                onTouchMove={handleColorAreaTouchMove}
                onTouchStart={handleColorAreaTouchStart}
                ref={colorAreaRef}
                style={{
                  background: `linear-gradient(to top, black 0%, transparent 50%, white 100%), linear-gradient(to right, transparent 0%, ${hueColor} 100%)`,
                }}
              >
                {/* Color indicator */}
                <div
                  className="-translate-x-1/2 -translate-y-1/2 absolute h-2.5 w-2.5 rounded-full border-2 border-white shadow-md"
                  style={{
                    left: `${indicatorX}%`,
                    top: `${indicatorY}%`,
                    backgroundColor: brushSettings.color,
                  }}
                />
              </div>

              {/* Hue Slider */}
              <div className="flex flex-col items-center">
                <Slider
                  className="h-24"
                  max={360}
                  min={0}
                  onValueChange={([value]) =>
                    handleHslChange(value, hsl[1], hsl[2])
                  }
                  orientation="vertical"
                  step={1}
                  value={[hsl[0]]}
                />
              </div>

              {/* Preset Colors - inline */}
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      aria-label={`Select color ${color}`}
                      className="h-5 w-full rounded border border-border shadow-sm transition-all hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      key={color}
                      onClick={() => handlePresetClick(color)}
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input Fields - compact */}
          <div className="space-y-1.5 border-t pt-1.5">
            {/* RGB Inputs */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="space-y-0.5">
                <Label
                  className="text-muted-foreground text-xs"
                  htmlFor="rgb-r"
                >
                  R
                </Label>
                <Input
                  className="h-7 text-xs"
                  id="rgb-r"
                  max={255}
                  min={0}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value) || 0;
                    handleRgbChange(
                      Math.max(0, Math.min(255, val)),
                      rgb[1],
                      rgb[2]
                    );
                  }}
                  type="number"
                  value={rgb[0]}
                />
              </div>
              <div className="space-y-0.5">
                <Label
                  className="text-muted-foreground text-xs"
                  htmlFor="rgb-g"
                >
                  G
                </Label>
                <Input
                  className="h-7 text-xs"
                  id="rgb-g"
                  max={255}
                  min={0}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value) || 0;
                    handleRgbChange(
                      rgb[0],
                      Math.max(0, Math.min(255, val)),
                      rgb[2]
                    );
                  }}
                  type="number"
                  value={rgb[1]}
                />
              </div>
              <div className="space-y-0.5">
                <Label
                  className="text-muted-foreground text-xs"
                  htmlFor="rgb-b"
                >
                  B
                </Label>
                <Input
                  className="h-7 text-xs"
                  id="rgb-b"
                  max={255}
                  min={0}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value) || 0;
                    handleRgbChange(
                      rgb[0],
                      rgb[1],
                      Math.max(0, Math.min(255, val))
                    );
                  }}
                  type="number"
                  value={rgb[2]}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
