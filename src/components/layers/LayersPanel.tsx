"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawingStore";

export function LayersPanel() {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    moveLayer,
  } = useDrawingStore();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button aria-label="Layers" size="icon" variant="outline">
          <Layers className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80" side="right">
        <SheetHeader>
          <SheetTitle>Layers</SheetTitle>
          <SheetDescription>Manage your drawing layers</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Button
            className="w-full"
            onClick={addLayer}
            size="sm"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Layer
          </Button>
          <Separator />
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                    activeLayerId === layer.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent/50"
                  }`}
                  key={layer.id}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        aria-label={layer.visible ? "Hide layer" : "Show layer"}
                        className="rounded-md p-1.5 transition-colors hover:bg-accent"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        type="button"
                      >
                        {layer.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{layer.visible ? "Hide layer" : "Show layer"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <button
                    className="flex-1 text-left font-medium text-sm transition-colors hover:text-primary"
                    onClick={() => setActiveLayer(layer.id)}
                    type="button"
                  >
                    {layer.name}
                  </button>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Move layer up"
                          className="rounded-md p-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={index === layers.length - 1}
                          onClick={() => moveLayer(layer.id, "up")}
                          type="button"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move layer up</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Move layer down"
                          className="rounded-md p-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={index === 0}
                          onClick={() => moveLayer(layer.id, "down")}
                          type="button"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move layer down</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Delete layer"
                          className="rounded-md p-1.5 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={layers.length === 1}
                          onClick={() => deleteLayer(layer.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete layer</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
