"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDrawingStore } from "@/lib/store/drawingStore";
import { ColorPicker } from "@/components/color/ColorPicker";
import { Brush, Eraser } from "lucide-react";

export function Toolbar() {
  const { currentTool, setCurrentTool } = useDrawingStore();

  return (
    <div className="flex items-center gap-4 border-b border-border bg-card px-6 py-4">
      <Tabs value={currentTool} onValueChange={(value) => setCurrentTool(value as "brush" | "eraser")}>
        <TabsList>
          <TabsTrigger value="brush" className="gap-2">
            <Brush className="h-4 w-4" />
            Brush
          </TabsTrigger>
          <TabsTrigger value="eraser" className="gap-2">
            <Eraser className="h-4 w-4" />
            Eraser
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="ml-auto flex items-center gap-3">
        <ColorPicker />
      </div>
    </div>
  );
}

