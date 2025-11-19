"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useDrawingStore } from "@/lib/store/drawingStore";

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

export function ColorPicker() {
  const { brushSettings, setBrushColor } = useDrawingStore();
  const [hsl, setHsl] = useState(() => hexToHsl(brushSettings.color));

  // Sync HSL when color changes externally
  useEffect(() => {
    setHsl(hexToHsl(brushSettings.color));
  }, [brushSettings.color]);

  const handleHslChange = (h: number, s: number, l: number) => {
    setHsl([h, s, l]);
    const hex = hslToHex(h, s, l);
    setBrushColor(hex);
  };

  const handleHexChange = (hex: string) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setBrushColor(hex);
      setHsl(hexToHsl(hex));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Color picker"
          className="h-10 w-10 rounded-md border-2 border-border shadow-sm ring-offset-background transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ backgroundColor: brushSettings.color }}
          type="button"
        />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="hue">
              Hue
            </Label>
            <Slider
              id="hue"
              max={360}
              min={0}
              onValueChange={([value]) =>
                handleHslChange(value, hsl[1], hsl[2])
              }
              step={1}
              value={[hsl[0]]}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="saturation">
              Saturation
            </Label>
            <Slider
              id="saturation"
              max={100}
              min={0}
              onValueChange={([value]) =>
                handleHslChange(hsl[0], value, hsl[2])
              }
              step={1}
              value={[hsl[1]]}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="lightness">
              Lightness
            </Label>
            <Slider
              id="lightness"
              max={100}
              min={0}
              onValueChange={([value]) =>
                handleHslChange(hsl[0], hsl[1], value)
              }
              step={1}
              value={[hsl[2]]}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="hex">
              Hex
            </Label>
            <Input
              className="font-mono"
              id="hex"
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              value={brushSettings.color}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
