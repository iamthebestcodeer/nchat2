"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function BrushControls() {
  const { brushSettings, setBrushSize, setBrushOpacity } = useDrawingStore();

  return (
    <div className="flex items-center gap-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <div className="flex items-center gap-4 flex-1 max-w-xs">
        <div className="space-y-2 flex-1">
          <Label htmlFor="brush-size" className="text-sm">
            Size: {brushSettings.size}px
          </Label>
          <Slider
            id="brush-size"
            min={1}
            max={100}
            step={1}
            value={[brushSettings.size]}
            onValueChange={([value]) => setBrushSize(value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-1 max-w-xs">
        <div className="space-y-2 flex-1">
          <Label htmlFor="brush-opacity" className="text-sm">
            Opacity: {Math.round(brushSettings.opacity * 100)}%
          </Label>
          <Slider
            id="brush-opacity"
            min={0}
            max={1}
            step={0.01}
            value={[brushSettings.opacity]}
            onValueChange={([value]) => setBrushOpacity(value)}
          />
        </div>
      </div>
    </div>
  );
}

