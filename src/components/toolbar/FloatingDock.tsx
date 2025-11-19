"use client";

import {
  Brush,
  Download,
  Eraser,
  Home,
  Redo2,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ColorPicker } from "@/components/color/ColorPicker";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function FloatingDock() {
  const {
    currentTool,
    setCurrentTool,
    undo,
    redo,
    clearCanvas,
    history,
    historyIndex,
    canvas,
    zoomIn,
    zoomOut,
    resetView,
    saveToStorage,
  } = useDrawingStore();

  const router = useRouter();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleExport = () => {
    if (!canvas) {
      return;
    }
    const link = document.createElement("a");
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <GlassPanel className="-translate-x-1/2 fixed bottom-8 left-1/2 z-50 flex items-center gap-2 p-2">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={() => router.push("/")}
              size="icon"
              variant="ghost"
            >
              <Home className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Home</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="h-8" orientation="vertical" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={() => setCurrentTool("brush")}
              size="icon"
              variant={currentTool === "brush" ? "secondary" : "ghost"}
            >
              <Brush className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Brush</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={() => setCurrentTool("eraser")}
              size="icon"
              variant={currentTool === "eraser" ? "secondary" : "ghost"}
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eraser</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="h-8" orientation="vertical" />

      <div className="flex items-center gap-1">
        <ColorPicker />
      </div>

      <Separator className="h-8" orientation="vertical" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              disabled={!canUndo}
              onClick={undo}
              size="icon"
              variant="ghost"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              disabled={!canRedo}
              onClick={redo}
              size="icon"
              variant="ghost"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="h-8" orientation="vertical" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={zoomOut}
              size="icon"
              variant="ghost"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={resetView}
              size="icon"
              variant="ghost"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={zoomIn}
              size="icon"
              variant="ghost"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="h-8" orientation="vertical" />

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={() => saveToStorage()}
              size="icon"
              variant="ghost"
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save Project</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl text-destructive hover:text-destructive"
              onClick={clearCanvas}
              size="icon"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Canvas</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-xl"
              onClick={handleExport}
              size="icon"
              variant="ghost"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export</TooltipContent>
        </Tooltip>
      </div>
    </GlassPanel>
  );
}
