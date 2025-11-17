"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function BrushControls() {
  const { brushSettings, setBrushSize, setBrushOpacity } = useDrawingStore();

  return (
    <div className="border-t border-border bg-card p-4">
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 flex-1 max-w-xs">
              <div className="space-y-2 flex-1">
                <Label htmlFor="brush-size" className="text-sm font-medium">
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
                <Label htmlFor="brush-opacity" className="text-sm font-medium">
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
        </CardContent>
      </Card>
    </div>
  );
}

