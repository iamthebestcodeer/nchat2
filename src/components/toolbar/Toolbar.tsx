"use client";

import { Brush, Eraser } from "lucide-react";
import { ColorPicker } from "@/components/color/color-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDrawingStore } from "@/lib/store/drawing-store";

export function Toolbar() {
  const { currentTool, setCurrentTool } = useDrawingStore();

  return (
    <div className="flex items-center gap-4 border-border border-b bg-card px-6 py-4">
      <Tabs
        onValueChange={(value) => setCurrentTool(value as "brush" | "eraser")}
        value={currentTool}
      >
        <TabsList>
          <TabsTrigger className="gap-2" value="brush">
            <Brush className="h-4 w-4" />
            Brush
          </TabsTrigger>
          <TabsTrigger className="gap-2" value="eraser">
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
