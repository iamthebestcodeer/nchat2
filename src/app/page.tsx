"use client";

import { DrawingCanvas } from "@/components/canvas/DrawingCanvas";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { BrushControls } from "@/components/brush/BrushControls";
import { LayersPanel } from "@/components/layers/LayersPanel";
import { Button } from "@/components/ui/button";
import { useDrawingStore } from "@/lib/store/drawingStore";
import { Download, Undo2, Redo2, Trash2 } from "lucide-react";

export default function Home() {
  const { canvas, undo, redo, clearCanvas, history, historyIndex } =
    useDrawingStore();

  const handleExport = () => {
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-black">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            <DrawingCanvas />
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={clearCanvas}
                aria-label="Clear canvas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <LayersPanel />
              <Button onClick={handleExport} variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <BrushControls />
        </div>
      </div>
    </div>
  );
}
