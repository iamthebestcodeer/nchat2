"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDrawingStore } from "@/lib/store/drawing-store";

export function BrushControls() {
  const { brushSettings, setBrushSize, setBrushOpacity } = useDrawingStore();

  return (
    <div className="border-border border-t bg-card p-4">
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          <div className="flex items-center gap-6">
            <div className="flex max-w-xs flex-1 items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label className="font-medium text-sm" htmlFor="brush-size">
                  Size: {brushSettings.size}px
                </Label>
                <Slider
                  id="brush-size"
                  max={100}
                  min={1}
                  onValueChange={([value]) => setBrushSize(value)}
                  step={1}
                  value={[brushSettings.size]}
                />
              </div>
            </div>
            <div className="flex max-w-xs flex-1 items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label className="font-medium text-sm" htmlFor="brush-opacity">
                  Opacity: {Math.round(brushSettings.opacity * 100)}%
                </Label>
                <Slider
                  id="brush-opacity"
                  max={1}
                  min={0}
                  onValueChange={([value]) => setBrushOpacity(value)}
                  step={0.01}
                  value={[brushSettings.opacity]}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
