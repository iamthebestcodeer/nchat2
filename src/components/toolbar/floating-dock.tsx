"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Brush,
  Circle,
  Download,
  Eraser,
  Home,
  Minus,
  PaintBucket,
  Redo2,
  RotateCcw,
  Save,
  Shapes,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color/color-picker";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawing-store";

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
    isSaving,
    lastSavedAt,
    saveError,
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
    toast.success("Drawing exported successfully");
  };

  const handleSave = async () => {
    const didSave = await saveToStorage();
    if (didSave) {
      toast.success("Project saved");
    } else {
      toast.error("Unable to save project");
    }
  };

  const handleClear = () => {
    clearCanvas();
    toast.info("Canvas cleared");
  };

  const isShapeTool = ["rectangle", "circle", "line"].includes(currentTool);

  return (
    <GlassPanel className="-translate-x-1/2 fixed bottom-8 left-1/2 z-50 flex items-center gap-1 p-2">
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

      <Separator className="h-6" orientation="vertical" />

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
        <TooltipContent>Brush (B)</TooltipContent>
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
        <TooltipContent>Eraser (E)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="rounded-xl"
            onClick={() => setCurrentTool("fill")}
            size="icon"
            variant={currentTool === "fill" ? "secondary" : "ghost"}
          >
            <PaintBucket className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fill (F)</TooltipContent>
      </Tooltip>

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                className="rounded-xl"
                size="icon"
                variant={isShapeTool ? "secondary" : "ghost"}
              >
                <Shapes className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Shapes</TooltipContent>
        </Tooltip>
        <PopoverContent className="flex w-auto gap-1 p-1" side="top">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-xl"
                onClick={() => setCurrentTool("rectangle")}
                size="icon"
                variant={currentTool === "rectangle" ? "secondary" : "ghost"}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rectangle (R)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-xl"
                onClick={() => setCurrentTool("circle")}
                size="icon"
                variant={currentTool === "circle" ? "secondary" : "ghost"}
              >
                <Circle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Circle (C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-xl"
                onClick={() => setCurrentTool("line")}
                size="icon"
                variant={currentTool === "line" ? "secondary" : "ghost"}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Line (L)</TooltipContent>
          </Tooltip>
        </PopoverContent>
      </Popover>

      <Separator className="h-6" orientation="vertical" />

      <ColorPicker />

      <Separator className="h-6" orientation="vertical" />

      <div className="flex items-center gap-0.5">
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

      <Separator className="h-6" orientation="vertical" />

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button className="rounded-xl" size="icon" variant="ghost">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>View Controls</TooltipContent>
        </Tooltip>
        <PopoverContent className="flex w-auto gap-1 p-1" side="top">
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
        </PopoverContent>
      </Popover>

      <Separator className="h-6" orientation="vertical" />

      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button className="rounded-xl" size="icon" variant="ghost">
                <Save className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Project Actions</TooltipContent>
        </Tooltip>
        <PopoverContent className="flex w-auto gap-1 p-1" side="top">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="rounded-xl"
                onClick={handleSave}
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
                onClick={handleClear}
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
        </PopoverContent>
      </Popover>

      <Separator className="h-6" orientation="vertical" />

      <div className="flex items-center rounded-xl bg-muted/40 px-3 py-1 text-xs">
        {isSaving ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        ) : saveError ? (
          <span className="flex items-center gap-1 text-destructive">
            <TriangleAlert className="h-3 w-3" />
            Save failed
          </span>
        ) : lastSavedAt ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {`Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <TriangleAlert className="h-3 w-3" />
            Not saved yet
          </span>
        )}
      </div>
    </GlassPanel>
  );
}
