"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDrawingStore } from "@/lib/store/drawingStore";
import { Layers, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";

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
        <Button variant="outline" size="icon" aria-label="Layers">
          <Layers className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Layers</SheetTitle>
          <SheetDescription>Manage your drawing layers</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Button
            onClick={addLayer}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Layer
          </Button>
          <Separator />
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    activeLayerId === layer.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="p-1.5 hover:bg-accent rounded-md transition-colors"
                        aria-label={layer.visible ? "Hide layer" : "Show layer"}
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
                    type="button"
                    onClick={() => setActiveLayer(layer.id)}
                    className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
                  >
                    {layer.name}
                  </button>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => moveLayer(layer.id, "up")}
                          disabled={index === layers.length - 1}
                          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Move layer up"
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
                          type="button"
                          onClick={() => moveLayer(layer.id, "down")}
                          disabled={index === 0}
                          className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Move layer down"
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
                          type="button"
                          onClick={() => deleteLayer(layer.id)}
                          disabled={layers.length === 1}
                          className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete layer"
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

